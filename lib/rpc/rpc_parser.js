var _ = require('busyman');
var RPC = require('freebird-constants');

function parse(msg) {
    var subsys, seq, id, cmd, args, status, data;

    if (_.isBuffer(msg))
        msg = msg.toString();

    if (_.isString(msg)) {
        try {
            msg = JSON.parse(msg);
            subsys = msg.subsys;
            seq = 

        } catch (e) {
            // ...
            return;
        }
    }

    if (!_.isObject(msg))
        return;

    if (!_.has(msg, '__intf') || !_.has(msg, 'subsys'))
        return;

    if (msg.__intf === 'REQ') {

    } else if (msg.__intf === 'RSP') {

    } else if (msg.__intf === 'IND') {

    }

    return {
        api: 'xxx',
        args: []
    }
}

function subsysToString(subsys) {
    var subsysString;

    if (_.isNumber(subsys)) {
         _.forEach(RPC.subsys, function (v, k) {
            if (v === subsys) {
                subsysString = k;
                return false;
            }
        });
    }

    return subsysString;
}

function cmdToString(subsys, cmd) {
    var cmdString;

    if (_.isNumber(cmd)) {
         _.forEach(RPC.api[subsys], function (v, k) {
            if (v === cmd) {
                cmdString = k;
                return false;
            }
        });
    }

    return cmdString;
}

