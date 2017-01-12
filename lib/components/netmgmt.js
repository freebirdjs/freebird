// [TODO] unload@reset
var _ = require('busyman');

var loader = require('./loader.js'),
    validate = require('../utils/validate.js');

var netMgmt = {};

netMgmt.start = function (callback) {   // callback is optional
    var self = this,
        typeErr,
        ncNum = this._netcores.length,
        shouldCbWithError = (ncNum === 1),
        cbCalled = false;

    var innerCallback = function (er) {
        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    } else if (ncNum === 0) {
        return setImmediate(callback, new Error('No netcore found, cannot start'));
    }

    // [TODO] what if fb already started? can we reload again?

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            innerCallback(err);
        } else {
            _.forEach(this._netcores, function (netcore) {
                netcore.start(function (e) {    // start all netcores
                    ncNum -= 1;

                    if (err && shouldCbWithError) {
                        innerCallback(err);
                    } else if (err) {
                        self.emit('error', err);
                    }

                    if (ncNum === 0 && !cbCalled) {
                        cbCalled = true;
                        callback(null);
                    }
                });
            });
        }
    });
};

netMgmt.stop = function (callback) {       // callback is optional
    var self = this,
        typeErr,
        ncNum = this._netcores.length,
        shouldCbWithError = (ncNum === 1),
        cbCalled = false;

    var innerCallback = function (er) {
        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    } else if (ncNum === 0) {   // no netcore found, no need to stop
        return setImmediate(callback);
    }

    _.forEach(this._netcores, function (netcore) {
        netcore.stop(function (err) {
            ncNum -= 1;

            if (err && shouldCbWithError) {
                innerCallback(err);
            } else if (err) {
                self.emit('error', err);
            }

            if (ncNum === 0 && !cbCalled) {
                cbCalled = true;
                callback(null);
            }
        });
    });
};

// [TODO] unload when reset hard
netMgmt.reset = function (mode, callback) {
    var self = this,
        typeErr,
        ncNum = this._netcores.length,
        shouldCbWithError = (ncNum === 1),
        cbCalled = false;

    var innerCallback = function (er) {
        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (typeErr = validate.modeTypeError(mode) ) {
        return setImmediate(innerCallback, typeErr);
    } else if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    } else if (ncNum === 0) {   // no netcore found
        return setImmediate(innerCallback, new Error('No netcore found, reset fails'));
    }

    _.forEach(this._netcores, function (netcore) {
        // loader.unloadByNetcore(this, );  // [TODO] unload

        netcore.reset(mode, function (err) {
            ncNum -= 1;

            if (err && shouldCbWithError) {
                innerCallback(err);
            } else if (err) {
                self.emit('error', err);
            }

            if (ncNum === 0 && !cbCalled) {
                cbCalled = true;
                callback(null);
            }
        });
    });
};

netMgmt.permitJoin = function (duration, callback) {       // callback is optional
    var self = this,
        typeErr,
        ncs = _.clone(this._netcores),
        originalNcNum = ncs.length,
        cbCalled = false;

    var innerCallback = function (er) {
        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (typeErr = validate.durationTypeError(duration)) {
        return setImmediate(innerCallback, typeErr);
    } else if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    } else if (originalNcNum === 0) {   // no netcore found
        return setImmediate(innerCallback, new Error('No netcore found, permitJoin fails'));
    }

    keepPermitting();

    function keepPermitting() {
        var ncore;

        if (ncs.length === 0 && !cbCalled) {
            cbCalled = true;
            return callback(null);
        }

        ncore = ncs.pop();
        ncore.permitJoin(duration, function (err) {
            if (err && (originalNcNum === 1)) 
                innerCallback(err);
            else if (err)
                self.emit('error', err);

            keepPermitting();   // just keep openning permission
        });
    }
};

netMgmt.maintain = function (ncName, callback) {  // ncName is optional. maintain all if not given. callback is optional
    var self = this,
        nc, ncs, typeErr, innerCallback,
        cbCalled = false;

    innerCallback = function (er) {
        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (_.isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (typeErr = _.isNil(ncName) ? undefined : validate.ncNameTypeError(ncName)) {
        return setImmediate(innerCallback, typeErr);
    } else if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    }

    if (_.isString(ncName)) {   // maintain a single
        nc = this.findByNet('netcore', ncName);
        if (!nc)
            return setImmediate(innerCallback, new Error('Cannot maintain, netcore not found'));
        else
            return nc.maintain(innerCallback);
    } else {                    // maintain all
        ncs = _.clone(this._netcores);
        keepNetcoreSyncing();
    }

    function keepNetcoreSyncing() {
        var ncore;

        if (ncs.length === 0 && !cbCalled) {
            cbCalled = true;
            return callback(null);
        }

        ncore = ncs.pop();
        ncore.maintain(function (err) {
            keepNetcoreSyncing();   // just keep syncing. Errors will be emitted by device or gadget
        });
    }
};

netMgmt.remove = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr);     // [TODO] if callback is not a function?
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));  // [TODO] need status code?

    nc.remove(permAddr, callback);
};

netMgmt.ban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr); // [TODO] if callback is not a function?
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });  // [TODO] where is RPC

    nc.ban(permAddr, callback);
};

netMgmt.unban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr); // [TODO] if callback is not a function?
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));  // [TODO] need status code?

    nc.unban(permAddr, callback);
};

netMgmt.ping = function (ncName, permAddr, callback) {
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        return setImmediate(callback, typeErr); // [TODO] if callback is not a function?
    else if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));  // [TODO] need status code?
    else if (!(dev = this.findByNet('device', ncName, permAddr)))
        return setImmediate(callback, new Error('device not found'));   // [TODO] need status code?

    dev.ping(callback);
};

module.exports = netMgmt;
