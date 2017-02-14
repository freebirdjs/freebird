'use strict';

var _ = require('busyman'),
    FreebirdConsts = require('freebird-constants');

var loader = require('./loader.js'),
    validate = require('../utils/validate.js'),
    Constants = require('../utils/constants.js');

var FB_STATE = Constants.FB_STATE,
    NC_STATE = Constants.NC_STATE,
    EVT_TOP = FreebirdConsts.EVENTS_TO_TOP;

var netMgmt = {};

netMgmt.start = function (callback) {   // callback is optional
    var self = this,
        typeErr,
        fbState = this._getState(),
        ncNum = this._netcores.length,
        stoppedNcs = [],
        startedNcs = [],
        cbCalled = false;

    var innerCallback = function (er) {
        if (er) self._setState(fbState);

        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }

        self._changeFireMode(1);
    };

    if (!_.isUndefined(callback)) 
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;

    if (ncNum === 0) 
        return setImmediate(innerCallback, new Error('No netcore found, cannot start'));
    if (fbState === FB_STATE.BOOTING || fbState === FB_STATE.STOPPING || fbState === FB_STATE.RESETTING)
        return setImmediate(innerCallback, new Error('Freebird can not start now'));

    this._setState(FB_STATE.BOOTING);
    stoppedNcs = this._netcores.filter(function (netcore) {
        return netcore._state === NC_STATE.UNKNOW;
    });

    if (fbState === FB_STATE.UNKNOW) {
        // reload all devices and gadgets from database
        loader.reload(this, function (err) {
            if (err) {
                innerCallback(err);
            } else {
                keepStarting();
            }
        });
    } else if (fbState === FB_STATE.NORMAL) {
        if (stoppedNcs.length === 0)
            return setImmediate(innerCallback, new Error('All netcores have been started'));
        else {
            this._changeFireMode(0);
            keepStarting();
        }
    }

    function keepStarting () {
        var ncore;

        if (stoppedNcs.length === 0 && !cbCalled) {
            self._setState(FB_STATE.NORMAL);
            self.maintain();

            if (fbState === FB_STATE.UNKNOW)
                self.emit(EVT_TOP.READY);

            return innerCallback(null);
        }

        ncore = stoppedNcs.pop();

        ncore.start(function (e) {
            var startedNcNum;

            if (fbState === FB_STATE.UNKNOW) {
                if (!e) {
                    startedNcs.push(ncore);
                    keepStarting();
                } else {
                    startedNcNum = startedNcs.length;

                    if (!startedNcNum)
                        return innerCallback(new Error(ncore.getName() + ' netcore start failed with error: ' + e.message));

                    _.forEach(startedNcs, function (netcore) {
                        netcore.stop(function (err) {
                            startedNcNum -= 1;

                            if (err) {
                                self.emit('error', err);
                            } else if (startedNcNum === 0) {
                                self._clearEventQueue();
                                innerCallback(new Error(ncore.getName() + ' netcore start failed with error: ' + e.message));
                            }
                        });
                    });
                }
            } else if (fbState === FB_STATE.NORMAL) {
                if (!e)
                    keepStarting();
                else
                    innerCallback(new Error(ncore.getName() + ' netcore start failed with error: ' + e.message));
            }
        });
    }
};

netMgmt.stop = function (callback) {       // callback is optional
    var self = this,
        typeErr,
        fbState = this._getState(),
        ncNum = this._netcores.length,
        shouldCbWithError = (ncNum === 1),
        startedNcs = [],
        cbCalled = false;

    var innerCallback = function (er) {
        if (er) self._setState(fbState);

        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }
    };

    if (!_.isUndefined(callback)) 
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;

    if (ncNum === 0)    // no netcore found, no need to stop
        return setImmediate(innerCallback, new Error('No netcore found, stop fails'));
    if (fbState !== FB_STATE.NORMAL)
        return setImmediate(innerCallback, new Error('Freebird can not stop now'));

    this._setState(FB_STATE.STOPPING);
    startedNcs = this._netcores.filter(function (netcore) {
        return netcore._state === NC_STATE.NORMAL;
    });

    keepStopping();

    function keepStopping () {
        var ncore;

        if (startedNcs.length === 0 && !cbCalled) {
            self._setState(FB_STATE.UNKNOW);
            return innerCallback(null);
        }

        ncore = startedNcs.pop();
        ncore.stop(function (e) {
            if (!e)
                keepStopping();
            else
                innerCallback(new Error(ncore.getName() + ' netcore stop failed with error: ' + e.message));
        });
    }
};

netMgmt.reset = function (mode, callback) {     // 0: soft, 1: hard
    var self = this,
        typeErr,
        fbState = this._getState(),
        ncs = _.clone(this._netcores),
        resettedNcs = [],
        cbCalled = false;

    var innerCallback = function (er) {
        if (er) self._setState(fbState);

        if (_.isFunction(callback) && !cbCalled) {
            cbCalled = true;
            callback(er);
        } else if (er) {
            self.emit('error', er);
        }

        self._changeFireMode(1);
    };

    if (typeErr = validate.modeTypeError(mode)) {
        throw typeErr;
    } else if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    }

    if (ncs.length === 0)    // no netcore found
        return setImmediate(innerCallback, new Error('No netcore found, reset fails'));
    if (fbState === FB_STATE.BOOTING || fbState === FB_STATE.STOPPING || fbState === FB_STATE.RESETTING)
        return setImmediate(innerCallback, new Error('Freebird can not reset now'));
    if (fbState === FB_STATE.UNKNOW && mode === 0)
        return setImmediate(innerCallback, new Error('You can only hard reset when freebird is stopped'));

    this._setState(FB_STATE.RESETTING);
    if (fbState === FB_STATE.UNKNOW && mode === 1)
        this._changeFireMode(0);
    keepResetting();

    function keepResetting () {
        var ncore;

        if (ncs.length === 0 && !cbCalled) {
            self._setState(FB_STATE.NORMAL);
            self.emit(EVT_TOP.READY);
            return innerCallback(null);
        }

        ncore = ncs.pop();
        ncore.reset(mode, function (e) {
            var resettedNcNums;

            if (fbState === FB_STATE.UNKNOW) {
                if (!e) {
                    loader.unloadByNetcore(self, ncore.getName(), function () {
                        resettedNcs.push(ncore);
                        keepResetting();
                    });
                } else {
                    resettedNcNums = resettedNcs.length;

                    if (!resettedNcNums)
                        return innerCallback(new Error(ncore.getName() + ' netcore reset failed with error: ' + e.message));

                    _.forEach(resettedNcs, function(netcore) {
                        netcore.stop(function (err) {
                            resettedNcNums -= 1;

                            if (err) {
                                self.emit('error', err);
                            } else if (resettedNcNums === 0) {
                                self._clearEventQueue();
                                innerCallback(new Error(ncore.getName() + ' netcore reset failed with error: ' + e.message));
                            }
                        }); 
                    });
                }
            } else if (fbState === FB_STATE.NORMAL) {
                if (!e && mode)
                    loader.unloadByNetcore(self, ncore.getName(), function () {
                        keepResetting();
                    });
                else if (!e)
                    keepResetting();
                else
                    innerCallback(new Error(ncore.getName() + ' netcore reset failed with error: ' + e.message));
            }
        });
    }
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
        throw typeErr;
    } else if (!_.isUndefined(callback)) {
        if (typeErr = validate.callbackTypeError(callback))
            throw typeErr;
    } 

    if (originalNcNum === 0) {   // no netcore found
        return setImmediate(innerCallback, new Error('No netcore found, permitJoin fails'));
    }

    keepPermitting();

    function keepPermitting() {
        var ncore;
        
        if (ncs.length === 0) {
            return innerCallback(null);
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
            self.emit('warn', er);
        }
    };

    if (_.isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (typeErr = _.isNil(ncName) ? undefined : validate.ncNameTypeError(ncName)) {
        throw typeErr;
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

        if (ncs.length === 0) {
            return innerCallback(null);
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
        throw typeErr;

    if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));

    nc.remove(permAddr, callback);
};

netMgmt.ban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        throw typeErr;

    if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));

    nc.ban(permAddr, callback);
};

netMgmt.unban = function (ncName, permAddr, callback) {
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        throw typeErr;

    if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));

    nc.unban(permAddr, callback);
};

netMgmt.ping = function (ncName, permAddr, callback) {
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(ncName) || validate.permAddrTypeError(permAddr) || validate.callbackTypeError(callback))
        throw typeErr;

    if (!(nc = this.findByNet('netcore', ncName)))
        return setImmediate(callback, new Error('netcore not found'));
    else if (!(dev = this.findByNet('device', ncName, permAddr)))
        return setImmediate(callback, new Error('device not found'));

    dev.ping(callback);
};

module.exports = netMgmt;
