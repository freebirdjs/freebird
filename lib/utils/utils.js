'use strict';

var _ = require('busyman');
var utils = {
    validate: require('proving')
};

utils.validate.callback = function (cb) {
    if (typeof cb !== 'function')
        throw new TypeError('callback should be a function.');
    return true;
};

utils.hasCalledWithArgsTypeError = function (args, mandatory, callback) {
    var err;

    utils.validate.callback(callback);

    _.forOwn(mandatory, function (mand, key) {
        err = utils.checkWsArg(key, args[key], mand);
        if (err)
            return false;
    });

    if (err) {
        utils.feedbackNextTick(err, null, callback);
        return true;    // invoked
    }

    return false;
}

utils.hasCalledWithNotFoundError = function (type, obj, callback) {
    if (utils.validate.callback(callback) && !obj) {
        utils.feedbackNextTick(new Error(type + ' not found.'), null, callback);
        return true;
    }
    return false;
};

utils.hasCalledWithNoDriverError = function (drv, callback) {
    utils.validate.callback(callback);

    if (!_.isFunction(drv)) {
        utils.feedbackNextTick(new Error('driver not found.'), null, callback);
        return true;
    }
    return false;
};

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

// [TODO] API interface defense

// utils.checkWsArg = function (name, val, mandatory) {
//     var err = null,
//         isCheckFail = false;

//     switch (name) {
//         case 'ncName':
//         case 'permAddr':
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isString(val)) : (!_.isUndefined(val) && !_.isString(val));
//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a string.') : null;
//             break;
//         case 'duration':
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isNumber(val)) : (!_.isUndefined(val) && !_.isNumber(val));
//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a number.') : null;
//             break;
//         case 'id':
//         case 'attrName':
//             isCheckFail = mandatory ? (_.isUndefined(val) || (!_.isString(val) && !_.isNumber(val))) : (!_.isUndefined(val) && (!_.isString(val) && !_.isNumber(val)));
//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a string or a number.') : null;
//             break;
//         case 'props':
//         case 'rptCfg':
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isPlainObject(val)) : (!_.isUndefined(val) && !_.isPlainObject(val));
//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an object.') : null;
//             break;
//         case 'ncNames':     // array of strings
//         case 'propNames':
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
//             if (!isCheckFail && _.isArray(val))
//                 isCheckFail = _.every(val, _.isString);

//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array of strings.') : null;
//             break;
//         case 'ids':     // array of numbers or strings
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
//             if (!isCheckFail && _.isArray(val))
//                 isCheckFail = _.every(val, function (v) {
//                     return _.isNumber(v) || _.isString(v);
//                 });

//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array of strings.') : null;
//             break;
//         case 'params':
//             isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
//             err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array.') : null;
//             break;
//         case 'value':
//             isCheckFail = mandatory ? _.isUndefined(val) : false;
//             err = isCheckFail ? new TypeError('Argument ' + name + ' must be given.') : null;
//             break;
//         default:
//             err = new TypeError('Unkown argument: ' + name + '.');
//             break;
//     }

//     return err;
// };

module.exports = utils;
