'use strict';

var _ = require('busyman');
var utils = {};

utils.feedback = function (err, data, callback) {
    process.nextTick(function () {
        callback(err, err ? undefined : data);
    });
};

utils.obtainNetcore = function (freebird, ncName, callback) {
    validate.fn(callback);
    var nc = freebird.find('netcore', ncName);

    if (!nc) {
        process.nextTick(function () {
            callback(new Error('netcore not found.'));
        });
    }
    return nc;
};

utils.obtainDevice = function (freebird, ncName, permAddr, callback) {
    var nc = utils.obtainNetcore(freebird, ncName, callback),
        dev = nc ? freebird.findFromNetcore(ncName, 'device', permAddr) : undefined;

    if (nc && !dev) {
        process.nextTick(function () {
            callback(new Error('device not found.'));
        });
    }
    return dev;
};

utils.obtainDeviceById = function (freebird, id, callback) {
    var dev = freebird.find('device', id);

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('device not found.'));
        });
    }
    return dev;
};

utils.obtainGadget = function (freebird, ncName, permAddr, auxId, callback) {
    var nc = utils.obtainNetcore(freebird, ncName, callback),
        gad = nc ? freebird.findFromNetcore(ncName, 'gadget', permAddr, auxId) : undefined;

    if (nc && !gad) {
        process.nextTick(function () {
            callback(new Error('gadget not found.'));
        });
    }
    return gad;
};

utils.obtainGadgetById = function (freebird, id, callback) {
    var gad = freebird.find('gadget', id);

    if (!gad) {
        process.nextTick(function () {
            callback(new Error('gadget not found.'));
        });
    }
    return gad;
};

utils.obtainDriver = function (freebird, namespace, drvName, callback) {
    var driver = this.find('driver', namespace, drvName);

    var nc = utils.obtainNetcore(freebird, ncName, callback),
        gad = nc ? freebird.findFromNetcore(ncName, 'gadget', permAddr, auxId) : undefined;

    if (!_.isFunction(driver)) {
        process.nextTick(function () {
            callback(new Error(namespace + ' driver not found: ' + drvName));
        });
    }
    return _.isFunction(driver) ? driver : undefined;
};

utils.checkWsArg = function (name, val, mandatory) {
    var err = null,
        isCheckFail = false;

    switch (name) {
        case 'ncName':
        case 'permAddr':
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isString(val)) : (!_.isUndefined(val) && !_.isString(val));
            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a string.') : null;
            break;
        case 'duration':
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isNumber(val)) : (!_.isUndefined(val) && !_.isNumber(val));
            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a number.') : null;
            break;
        case 'id':
        case 'attrName':
            isCheckFail = mandatory ? (_.isUndefined(val) || (!_.isString(val) && !_.isNumber(val))) : (!_.isUndefined(val) && (!_.isString(val) && !_.isNumber(val)));
            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with a string or a number.') : null;
            break;
        case 'props':
        case 'rptCfg':
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isPlainObject(val)) : (!_.isUndefined(val) && !_.isPlainObject(val));
            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an object.') : null;
            break;
        case 'ncNames':     // array of strings
        case 'propNames':
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
            if (!isCheckFail && _.isArray(val))
                isCheckFail = _.every(val, _.isString);

            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array of strings.') : null;
            break;
        case 'ids':     // array of numbers or strings
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
            if (!isCheckFail && _.isArray(val))
                isCheckFail = _.every(val, function (v) {
                    return _.isNumber(v) || _.isString(v);
                });

            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array of strings.') : null;
            break;
        case 'params':
            isCheckFail = mandatory ? (_.isUndefined(val) || !_.isArray(val)) : (!_.isUndefined(val) && !_.isArray(val));
            err = isCheckFail ? new TypeError('Argument ' + name + ' should be given with an array.') : null;
            break;
        case 'value':
            isCheckFail = mandatory ? _.isUndefined(val) : false;
            err = isCheckFail ? new TypeError('Argument ' + name + ' must be given.') : null;
            break;
        default:
            err = new TypeError('Unkown argument: ' + name + '.');
            break;
    }

    return err;
};

utils.passWsArgsCheck = function (args, mandatory, callback) {
    var err;

    _.forOwn(mandatory, function (mand, key) {
        err = utils.checkWsArg(key, args[key], mand);
        if (err)
            return false;
    });

    if (err) {
        process.nextTick(function () {
            callback(err);
        });
        return false;   // fail
    } else {
        return true;    // pass
    }
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

utils.dumpDevInfo = function (dev) {
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

utils.dumpGadInfo = function (gad) {
    return gad.dump();
};

module.exports = utils;