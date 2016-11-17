'use strict';

var _ = require('buysman'),
    RPC = require('freebird-constants').RPC;

var apis = require('./apis.js'),
    utils = require('../utils/utils.js');

function Agent(freebird) {
    this._transports = [];
    this._freebird = freebird;
}

Agent.prototype.addTransport = function (transp, callback) {
    var self = this,
        callback = callback || function (err) {
            self._freebird.emit('error', err);
        };

    if (!_.isObject(transp) || !_.isFunction(transp.send) || !_.isFunction(transp.broadcast))
        return setImmediate(callback, new TypeError('Invalid transp object'));

    if (!_.isFunction(transp.emit) || !_.isFunction(transp.on))
        return setImmediate(callback, new TypeError('transp object should be an event emitter'));

    if (!_.includes(this._transports, transp)) {
        this._transports.push(transp);

        transp.on('message', function (msg) {                       // msg: { clientId, data }
            self.incomingMessageHandler(transp, msg);
        });
    }

    setImmediate(callback, null);
};

Agent.prototype.incomingMessageHandler = function (transp, msg) {   // msg: { clientId, data }
    // msg.data could be the json strings of
    //  REQ: { _intf, subsys, seq, id, cmd, args }
    //  RSP: { _intf, subsys, seq, id, cmd, status, data }
    //  IND: { _intf, subsys, type, id, data }
    var self = this;

    this.parseIncomingMessage(msg, function (result) {              // { valid: true, data: jmsg }
        var jmsg = result.data;

        if (!result.valid || utils.rpcIntfString(jmsg.__intf) !== 'REQ') {
            transp.emit('unhandledMessage', msg);   // Loop back to transp if not a REQ message
        } else {
            self.incomingRequestHandler(transp, jmsg, function (err, rsp) {
                transp.send({ clientId: msg.clientId, data: JSON.stringify(rsp) });
            });
        }
    };
};

Agent.prototype.parseIncomingMessage = function (msg, callback) {
    var result = utils.jsonToObject(msg.data),
        jmsg = result.valid ? result.data : undefined,
        parsed; // { valid: true/false, data: msg }

    if (!result.valid)
        parsed = result;
    else if (!_.has(jmsg, '__intf') || !_.has(jmsg, 'subsys'))
        parsed = { valid: false, data: msg.data };
    else
        parsed = { valid: true, data: jmsg };

    setImmediate(callback, parsed);
};

Agent.prototype.incomingRequestHandler = function (transp, reqObj, callback) {
    var freebird = this._freebird,
        subsysName = utils.rpcSubsysString(reqObj.subsys),
        apiName = utils.rpcApiString(subsysName, reqObj.cmd),
        args = reqObj.args,
        api,
        rsp = {
            __intf: 'RSP',
            subsys: reqObj.subsys,
            seq: reqObj.seq,
            id: reqObj.id,      // will be replaced after api called
            cmd: reqObj.cmd,
            status: 0,          // will be replaced after api called
            data: null          // will be attached after api called
        };

    if (_.isNumber(rsp.subsys))
        rsp.__intf = RPC.Interface.RSP;

    if (!apiName) {
        rsp.status = 400;
        return setImmediate(callback, null, rsp);
    }

    if (subsysName === 'dev' || subsysName === 'gad')
        apiName = subsysName + _.upperFirst(apiName);

    api = apis[apiName];

    if (!_.isFunction(api)) {
        rsp.status = 400;
        return setImmediate(callback, null, rsp);
    } else {
        api.call(freebird, args, function (err, result) {
            rsp.status = result.status;
            rsp.id = _.isNil(result.id) ? reqObj.id : result.id; 

            delete result.id;
            delete result.status;

            if (!err)
                rsp.data = result;

            callback(err, rsp);
        });
    }
};

Agent.prototype.indicate = function (msg, callback) {
    var numTransp = this._transports.length,
        shouldReportError = (numTransp === 1) ? true : false;

    if (numTransp === 0)
        return setImmediate(callback, null, 0);

    if (_.isObject(msg))
        msg = JSON.stringify(msg);

    _.forEach(this._transports, function (transp) {
        transp.broadcast({ data: msg }, function (err, bytes) {
            numTransp -= 1;
            if (numTransp === 0)
                callback(shouldReportError ? err : null, bytes);  // Don't care error if transp num > 1
        });
    });
};

module.exports = Agent;
