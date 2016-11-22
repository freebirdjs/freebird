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
