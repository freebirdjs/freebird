'use strict';

var validate = require('proving');

validate.callback = function (val) {
    if (typeof val !== 'function')
        throw new TypeError('callback should be function');

    return true;
};

validate.isTypeError = function (args, mandatory, callback) {
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
};

// Duck Type Checking
validate.isGadget = function (gad) {};
validate.isDevice = function (gad) {};
validate.isNetcore = function (gad) {};