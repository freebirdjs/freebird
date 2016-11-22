'use strict';

var _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var utils = {
    validate: require('proving')
};

var EMSG = {
    String: function (name) {
        return name + ' should be a string';
    },
    Number: function (name) {
        return name + ' should be a number';
    },
    NotFound: function (name) {
        return name + ' not found';
    }
};

// var idTypeErrMsg = 'id should be a number or a string',
//     attrNameTypeErrMsg = 'attrName should be a string',
//     rptCfgTypeErrMsg = 'rptCfg should be an object';

utils.dumpNetcoreInfo = function (nc) {
    var freebird = nc._freebird,
        info = nc.dump(),
        allDevs,
        allGads;

    info.numDevs = 0;
    info.numGads = 0;
    delete info.defaultJoinTime;

    if (freebird) {
        allDevs = freebird._devbox.filter(function (dev) {
            return nc === dev.get('netcore');
        });

        allGads = freebird._gadbox.filter(function (gad) {
            return nc === gad.get('netcore');
        });

        info.numDevs = allDevs.length;
        info.numGads = allGads.length;
    }

    return info;
};

utils.dumpDeviceInfo = function (dev) {
    var info = dev.dump(),
        gadIds = _.map(info.gads, function (rec) {
            return rec.gadId;
        });

    info.gads = null;
    info.gads = gadIds;
    delete info.net.maySleep;
    delete info.net.sleepPeriod;

    return info;
};

utils.dumpGadgetInfo = function (gad) {
    return gad.dump();
};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
utils.findByKey = function (obj, key) {
    return _.has(obj, key) ? { key: key, value: obj[key] } : undefined;
};

utils.findByValue = function (obj, val) {
    var item;

    _.forEach(obj, function (v, k) {
        if (v === val) {
            item = { key: k, value: v };
            return false;
        }
    });

    return item;
};

utils.rpcIntf = function (intf) {
    if (_.isString(intf))
        return utils.findByKey(RPC.Interface, intf);
    else if (_.isNumber(intf))
        return utils.findByValue(RPC.Interface, intf);
};

utils.rpcSubsys = function (subsys) {
    if (_.isString(subsys))
        return utils.findByKey(RPC.Subsys, subsys);
    else if (_.isNumber(subsys))
        return utils.findByValue(RPC.Subsys, subsys);
};

utils.rpcApi = function (subsys, cmdId) {
    var subsysItem = utils.rpcSubsys(subsys),
        apiNames = subsysItem ? RPC.Api[subsysItem.key] : undefined;

    if (!apiNames)
        return;
    else if (_.isString(cmdId))
        return utils.findByKey(apiNames, cmdId);
    else if (_.isNumber(cmdId))
        return utils.findByValue(apiNames, cmdId);
}

// utils.findKeyByString = function (obj, str) {
//     return _.has(obj, str) ? str : undefined;
// }

// utils.findKeyByValue = function (obj, val) {
//     var str;
//     _.forEach(obj, function (v, k) {
//         if (v === val) {
//             str = k;
//             return false;
//         }
//     });
//     return str;
// }

// utils.rpcIntfString = function (intf) {
//     if (_.isString(intf))
//         return utils.findKeyByString(RPC.Interface, intf);
//     else if (_.isNumber(intf))
//         return utils.findKeyByValue(RPC.Interface, intf);
// }

// utils.rpcSubsysString = function (subsys) {
//     if (_.isString(subsys))
//         return utils.findKeyByString(RPC.Subsys, subsys);
//     else if (_.isNumber(subsys))
//         return utils.findKeyByValue(RPC.Subsys, subsys);
// }

// utils.rpcApiString = function (subsys, cmdId) {
//     var subsysStr = utils.rpcSubsysString(subsys),
//         apiNames = subsysStr ? RPC.Api[subsysStr] : undefined;

//     if (!apiNames)
//         return;
//     else if (_.isString(cmdId))
//         return utils.findKeyByString(apiNames, cmdId);
//     else if (_.isNumber(cmdId))
//         return utils.findKeyByValue(apiNames, cmdId);
// }

utils.jsonToObject = function (msg) {
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

module.exports = utils;
