// [TODO] L117, L145 tweet error?
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
            throw err;
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
    // msg.data could be the json strings of { _intf, subsys, seq, id, cmd, args } (REQ)

    var self = this,
        clientId = msg.clientId;

    this.parseIncomingMessage(msg, function (result) {              // { valid: true, data: jmsg }
        var jmsg = result.data;

        if (!result.valid || utils.rpcIntfString(jmsg.__intf) !== 'REQ') {
            setImmediate(function () {
                transp.emit('unhandledMessage', msg);   // Loop back to transp if not a REQ message
            });
        } else {
            self.incomingRequestHandler(transp, jmsg, function (rsp) {
                transp.send({ clientId: clientId, data: JSON.stringify(rsp) });
            });
        }
    });
};

Agent.prototype.parseIncomingMessage = function (msg, callback) {
    var result = jsonToObject(msg.data),
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
        rsp.status = RPC.Status.BadRequest;
        return setImmediate(callback, rsp);
    }

    if (subsysName === 'dev' || subsysName === 'gad')
        apiName = subsysName + _.upperFirst(apiName);

    api = apis[apiName];

    if (!_.isFunction(api)) {
        rsp.status = RPC.Status.BadRequest;
        return setImmediate(callback, rsp);
    } else {
        api.call(freebird, args, function (err, result) {
            //  RSP: { _intf, subsys, seq, id, cmd, status, data }
            rsp.status = result.status;
            rsp.id = result.id;
            rsp.data = result;

            delete result.id;
            delete result.status;

            if (err) {
                // [TODO] emit or tweet error?
            }

            callback(rsp);
        });
    }
};

Agent.prototype.indicate = function (msg, callback) {
    var numTransp = this._transports.length,
        shouldReportError = (numTransp === 1) ? true : false;

    if (numTransp === 0)
        return setImmediate(callback, null, 0);

    if (_.isObject(msg)) {
        try {
            msg = JSON.stringify(msg);
        } catch (e) {
            return setImmediate(callback, e);
        }
    } else if (!_.isString(msg)) {
        return setImmediate(callback, new TypeError('Message of an indication should be a string or an data object'));
    }

    _.forEach(this._transports, function (transp) {
        transp.broadcast({ data: msg }, function (err, bytes) {
            if (err) {
                // [TODO] fire error?
            }
            numTransp -= 1;
            if (numTransp === 0)
                callback(shouldReportError ? err : null, bytes);    // Don't care error if transp num > 1
        });
    });
};

function jsonToObject(msg) {
    var message = Buffer.isBuffer(msg) ? msg.toString() : undefined,
        jmsg;

    if (_.isString(msg))
        message = msg;

    if (!message)
        return { valid: false, data: msg };

    try {
        jmsg = JSON.parse(message);
    } catch (e) {
        return { valid: false, data: msg };
    }

    return { valid: true, data: jmsg };
}

module.exports = Agent;
