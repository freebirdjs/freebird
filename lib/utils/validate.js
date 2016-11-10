var validate = require('proving');

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
}