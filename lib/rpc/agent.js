var _ = require('buysman'),
    apis = require('./apis.js'),
    RPC = require('freebird-constants').RPC;

function Agent(freebird) {
    this._transports = [];
    this._freebird = freebird;
}

Agent.prototype.addTransport = function (transp, callback) {
    var self = this,
        callback = callback || function (err) {
            self._freebird.emit('error', err);
        };

    if (!_.isObject(transp) || !_.isFunction(transp.send) || !_.isFunction(transp.receive))
        return setImmediate(callback, new TypeError('Invalid transp object'));

    if (_.includes(this._transports, transp))
        return setImmediate(callback, new Error('The transport already exists'));

    this._transports.push(transp);

    transp.on('message', function (msg) {
        self.requestHandler(transp, msg);
    });
};

Agent.prototype.requestHandler = function (transp, msg) {
    var freebird = this._freebird;

    this.parseRequest(msg, function (err, reqObj) { // reqObj = { api, args }
        var api = reqObj.api,
            args = reqObj.args,
            rsp = {
                __intf: 'RSP',
                subsys: reqObj.subsys,
                seq: reqObj.seq,
                id: 0,      // [TODO]
                cmd: reqObj.cmd,
                status: 0,  // [TODO]
                data: null
            };

        if (err) {
            // ...
        } else if (_.isFunction(api)) {
            api.call(freebird, args, function (err, result) {
                rsp.id = result.id;
                // delete result.id
                rsp.data = result;

                transp.send(result);
            });
        }
    });
};

Agent.prototype.indicate = function (msg, callback) {
    var numTransp = this._transports.length;

    _.forEach(this._transports, function (transp) {
        transp.send(msg, function (err, bytes) {
            numTransp -= 1;
            if (numTransp === 0)
                callback(err, bytes);
        });
    });
};

Agent.prototype.parseRequest = function (msg, callback) {
    var subsys, seq, id, cmd, args, status, data;
    var jsonMsg;

    if (Buffer.isBuffer(msg))
        msg = msg.toString();

    if (_.isString(msg)) {
        try {
            jsonMsg = JSON.parse(msg);
        } catch (e) {
            // do nothing
        }
    } else if (_.isObject(msg) && !_.isArray(msg)) {
        jsonMsg = msg;
    }

    if (!jsonMsg || !_.has(jsonMsg, '__intf'))
        return; // [TODO] loop msg back to server itself

    if (jsonMsg.__intf === 'RSP' || jsonMsg.__intf === 'IND')
        return; // we only deal with 'REQ'

    jsonMsg.api = getRpcApi(jsonMsg.subsys, jsonMsg.cmd);

    setImmediate(callback, null, jsonMsg);
};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
function getRpcIntf(intf) {
    var _intfStr;

    if (_.isNumber(intf)) {
        _.forOwn(RPC.interface, function (v, k) {
            if (v === intf) {
                _intfStr = k;
                return false;
            }
        });
    } else if (_.isString(intf) && !_.isUndefined(RPC.interface[intf])) {
        _intfStr = intf;
    }

    return _intfStr;
}

function getRpcSubsys(subsys) {
    var subsysStr;

    if (_.isNumber(subsys)) {
        _.forOwn(RPC.subsys, function (v, k) {
            if (v === subsys) {
                subsysStr = k;
                return false;
            }
        });
    } else if (_.isString(subsys) && !_.isUndefined(RPC.subsys[subsys])) {
        subsysStr = subsys;
    }

    return subsysStr;
}

function getRpcApi(subsys, cmdId) {
    var subsysStr = getRpcSubsys(subsys),
        apis,
        cmdStr;

    if (!_.isUndefined(subsysStr))
        apis = RPC.api[subsysStr];

    if (_.isObject(apis)) {
        if (_.isNumber(cmdId)) {
            _.forOwn(apis, function (v, k) {
                if (v === cmdId) {
                    cmdStr = k;
                    return false;
                }
            });
        } else if (_.isString(cmdId) && !_.isUndefined(apis[cmdId])) {
            cmdStr = cmdId;
        }

        if (cmdStr && (subsysStr === 'dev' || subsysStr === 'gad'))
            cmdStr = subsysStr + _.upperFirst(cmdStr);
    }

    return cmdStr;
}
