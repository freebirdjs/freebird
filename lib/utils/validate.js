'use strict';

var validate = require('proving');

// Duck Type Checking
validate.isGadget = function (gad) {
    return (_.isObject(gad) && _.has(gad, '_id') && _.has(gad, '_auxId') && _.has(gad, '_dev'))
};

validate.isDevice = function (dev) {
    return (_.isObject(dev) && _.has(dev, '_netcore') && _.has(dev, '_id'))
};

validate.isNetcore = function (nc) {
    return (_.isObject(nc) && _.has(nc, '_freebird') && _.has(nc, '_controller'))
};

validate.ncNameTypeError = function (ncName) {
    return _.isString(ncName) ? undefined : new TypeError('ncName should be a string');
}

validate.callbackTypeError = function (cb) {
    return _.isFunction(cb) ? undefined : new TypeError('callback should be a function');
}

validate.ncNamesTypeError = function (ncNames) {
    if(!_.isArray(ncNames) || !_.every(ncNames, _.isString))
        return new TypeError('ncNames should be an array of string');
}

validate.permAddrTypeError = function (permAddr) {
    return _.isString(permAddr) ? undefined : new TypeError('permAddr should be a string');
}

validate.idsTypeError = function (ids) {
    function validId(id) {
        return (_.isString(id) || _.isNumber(id));
    }

    if(!_.isArray(propNames) || !_.every(ids, validId))
        return new TypeError('ids should be an array of number or string');
}

validate.modeTypeError = function (mode) {
    return (mode === 1 || mode === 0) ? undefined : new TypeError('mode only accepts 0 or 1');
}

validate.idTypeError = function (id) {
    return (_.isNumber(id) || _.isString(id)) ? undefined : new TypeError('id should be a number or a string');
}

validate.durationTypeError = function (du) {
    return (_.isNumber(du)) ? undefined : new TypeError('duration should be a number');
}

validate.propsTypeError = function (props) {
    return _.isPlainObject(props) ? undefined : new TypeError('props should be an object');
}

validate.rptCfgTypeError = function (rptCfg) {
    return _.isPlainObject(rptCfg) ? undefined : new TypeError('rptCfg should be an object');
}

validate.propNamesTypeError = function (propNames) {
    if (!_.isNil(propNames)) {
        if(!_.isArray(propNames) || !_.every(propNames, _.isString))
            return new TypeError('propNames should be an array of string');
    } 
}

validate.attrNameTypeError = function (attrName) {
    return _.isString(attrName) ? undefined : new TypeError('attrName should be a string');
}

validate.paramsTypeError = function (params) {
    return _.isArray(params) ? undefined : new TypeError('params should be an array');
}

module.exports = validate;
