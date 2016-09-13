'use strict';

var _ = require('busyman'),
    utils = require('../utils/utils');

var netDriverNames = [ 'start', 'stop', 'enable', 'disable', 'reset', 'permitJoin', 'remove', 'ban', 'unban', 'ping', 'maintain' ],
    devDriverNames = [ 'read', 'write', 'identify', 'enable', 'disable' ],
    gadDriverNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable' ];

var drvApis = {};

drvApis.bindDrivers = function (freebird) {
    freebird.net = _.isObject(freebird.net) ? freebird.net : {};
    freebird.dev = _.isObject(freebird.dev) ? freebird.dev : {};
    freebird.gad = _.isObject(freebird.gad) ? freebird.gad : {};

    _.forEach(netDriverNames, function (name) {
        freebird.net[name] = drvApis[name].bind(freebird);
    });

    _.forEach(devDriverNames, function (name) {
        freebird.dev[name] = drvApis['dev' + _.upperFirst(name)].bind(freebird);
    });

    _.forEach(gadDriverNames, function (name) {
        freebird.gad[name] = drvApis['gad' + _.upperFirst(name)].bind(freebird);
    });
};

/*************************************************************************************************/
/*** Net Drivers                                                                               ***/
/*************************************************************************************************/
drvApis.enable = function (ncName, callback) {
    // callback will be invoked with err-back in utils.obtainNetcore() if nc not found
    var nc = utils.obtainNetcore(this, ncName, callback),
        err = null;

    if (nc) {
        try {
            nc.enable();
        } catch (e) {
            err = e;
        } finally {
            process.nextTick(function () {
                callback(err, err ? undefined : nc.isEnabled());
            });
        }
    }
};  // callback(err, isEnabled)

drvApis.disable = function (ncName, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback),
        err = null;

    if (nc) {
        try {
            nc.disable();
        } catch (e) {
            err = e;
        } finally {
            process.nextTick(function () {
                callback(err, err ? undefined : nc.isEnabled());
            });
        }
    }
};  // callback(err, isEnabled)

drvApis.start = function (ncName, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.start(callback);
};  // callback(err)

drvApis.stop = function (ncName, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.stop(callback);
};  // callback(err)

drvApis.reset = function (ncName, mode, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.reset(mode, callback);
};  // // callback(err)

drvApis.permitJoin = function (ncName, duration, callback) {
    var self = this,
        nc;

    callback = callback || function (err, timeLeft) {
        if (err)
            self.emit('_nc:error', err);
    };

    nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.permitJoin(duration, callback);
};  // callback(err, timeLeft)

drvApis.remove = function (ncName, permAddr, callback) {
    // callback will be invoked with err-back in utils.obtainDevice() if nc or dev not found
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        dev._removing = true;   // devLeaving Helper
        nc.remove(permAddr, function (err, result) {
            if (err)
                dev._removing = false;
            callback(err, result);
        });
    }
};  // callback(err, permAddr)

drvApis.ban = function (ncName, permAddr, callback) {
    var self = this,
        nc = utils.obtainNetcore(this, ncName, callback),
        dev = this.findFromNetcore(ncName, 'device', permAddr);

    if (nc) {   // still ban if no dev found
        nc.ban(permAddr, function (err, result) {
            if (err) {
                callback(err);
            } else if (dev) {
                self.unregister('device', dev, function (e) {
                    callback(e, e ? undefined : permAddr);
                });
            } else {
                callback(null, permAddr);
            }
        });
    }
};  // callback(err, permAddr)

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.unban(permAddr, callback);
};  // callback(err, permAddr)

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = utils.obtainNetcore(this, ncName, callback);
    if (nc)
        nc.ping(permAddr, callback);
};  // callback(err, time)

drvApis.maintain = function (ncName, permAddr, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);

    if (dev)
        dev.refresh(callback);
};

/*************************************************************************************************/
/*** Device Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.devEnable = function (ncName, permAddr, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        try {
            dev.enable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};  // callback(err, isEnabled)

drvApis.devDisable = function (ncName, permAddr, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        try {
            dev.disable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};  // callback(err, isEnabled)

drvApis.devRead = function (ncName, permAddr, attr, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.read(attr, callback);
};  // callback(err, val)

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.write(attr, val, callback);
};  // callback(err, val)

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var dev = utils.obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.identify(callback);
};  // callback(err)

/*************************************************************************************************/
/*** Gadget Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.gadEnable = function (ncName, permAddr, auxId, callback) {
    // callback will be invoked with err-back in utils.obtainGadget() if nc or gad not found
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad) {
        try {
            gad.enable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};  // callback(err, isEnabled)

drvApis.gadDisable = function (ncName, permAddr, auxId, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad) {
        try {
            gad.disable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};  // callback(err, isEnabled)

drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.read(attr, callback);
};  // callback(err, val)

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.write(attr, val, callback);
};  // callback(err, val)

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.exec(attr, args, callback);
};  // callback(err, result)

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, attrName, cfg, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.setReportCfg(attrName, cfg, callback);
};  // callback(err, result)

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, attrName, callback) {
    var gad = utils.obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.getReportCfg(attrName, callback);
};  // callback(err, cfg)

module.exports = drvApis;
