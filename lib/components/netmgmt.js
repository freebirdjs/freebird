var loader = require('./loader.js'),
    validate = require('../utils/validate.js');

var netMgmt = {};


Freebird.prototype.start = netmgmt.start;
Freebird.prototype.stop = netmgmt.stop;

Freebird.prototype.reset = netmgmt.reset;               // function (mode)
Freebird.prototype.permitJoin = netmgmt.permitJoin;     // function (duration)
Freebird.prototype.maintain = netmgmt.maintain;         // function ([ncName,] permAddr)

netMgmt.start = function (callback) {   // callback is optional
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            process.nextTick(function () {
                self.emit('error', err);
            });
            cbCalled = true;
            callback(err);
        } else {
            netcores.forEach(function (nc) {    // start all netcores
                nc.start(function (er) {
                    ncNum -= 1;
                    if (er && !cbCalled) {
                        self.emit('error', er);
                        callback();
                    }

                    else if (ncNum === 0 && !cbCalled)
                        callback();
                });
            });
        }
    });
};

netMgmt.stop = function (callback) {       // callback is optional
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;
};

netMgmt.reset = function (mode, callback) {
    var ncNum, typeErr;

    if (typeErr = validate.modeTypeError(mode) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);

    ncNum = this._netcores.length;
    shouldCbWithError = (ncNum === 1) ? true : false;

    _.forEach(this._netcores, function (netcore) {
        netcore.reset(args.mode, function (err) {
            if (err) {
                // Do nothing. Maybe fire error?
            }

            ncNum -= 1;
            if (ncNum === 0)
                setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        });
    });

};

netMgmt.permitJoin = function (duration, callback) {       // callback is optional
    var ncNum, shouldCbWithError, typeErr;

    if (typeErr = validate.durationTypeError(duration) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);

    ncNum = this._netcores.length;
    shouldCbWithError = (ncNum === 1) ? true : false;

    _.forEach(this._netcores, function (nc) {
        nc.permitJoin(duration, function (err) {
            if (err && !shouldCbWithError) {
                // Do nothing. Maybe fire error?
            }

            ncNum -= 1;
            if (ncNum === 0)
                setImmediate(callback, shouldCbWithError ? err : null);
        });
    });
};

netMgmt.maintain = function (ncName, callback) {  // ncName is optional. maintain all if not given.  callback is optional
    var nc,
        devs,
        typeErr;

    if (_.isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    typeErr = _.isNil(ncName) ? undefined : validate.ncNameTypeError(ncName);

    if (typeErr = typeErr || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);

    if (_.isString(ncName)) {   // maintain a single
        if (!(nc = this.findByNet('netcore', ncName)));
            return setImmediate(callback, new Error('netcore not found'));

        devs = this._devbox.filter(function (dev) {
            return (dev.get('netcore') === nc) && (dev.get('status') !== 'offline');
        });

    } else {                    // maintain all
        devs = this._devbox.filter(function (dev) {
            return (dev.get('status') !== 'offline');
        });
    }

    // [TODO]
    _.forEach(devs, function (dev) {
        dev.maintain(function () {

        });
    });
};

netMgmt.remove = function (ncName, permAddr, callback) {
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));
    else if (!(dev = this.findByNet('device', ncName, permAddr)))
        return setImmediate(callback, new Error('device not found'));

    nc.remove(permAddr, callback);
};

netMgmt.ban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.ban(permAddr, callback);
};

netMgmt.unban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));

    nc.unban(permAddr, callback);
};

netMgmt.ping = function (ncName, permAddr, callback) {
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));
    else if (!(dev = this.findByNet('device', ncName, permAddr)))
        return setImmediate(callback, new Error('device not found'));

    dev.ping(callback);
};

module.exports = netMgmt;
