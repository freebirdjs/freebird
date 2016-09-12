'use strict';

var _ = require('busyman');
var drvApis = {};
var netDriverNames = [ 'start', 'stop', 'enable', 'disable', 'reset', 'permitJoin', 'remove', 'ban', 'unban', 'ping', 'maintain' ],
    devDriverNames = [ 'read', 'write', 'identify', 'enable', 'disable' ],
    gadDriverNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable' ];

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
drvApis.start = function (ncName, callback) {
    var nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.start(callback);
};

drvApis.stop = function (ncName, callback) {
    var nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.stop(callback);
};

drvApis.enable = function (ncName, callback) {
    var nc = obtainNetcore(this, ncName, callback),
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
};

drvApis.disable = function (ncName, callback) {
    var nc = obtainNetcore(this, ncName, callback),
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
};

drvApis.reset = function (ncName, mode, callback) {
    var nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.reset(mode, callback);
};

drvApis.permitJoin = function (ncName, duration, callback) {
    var self = this,
        nc;

    callback = callback || function (err, timeLeft) {
        if (err)
            self.emit('_nc:error', err);
    };

    nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.permitJoin(duration, callback);
};

drvApis.remove = function (ncName, permAddr, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        dev._removing = true;   // devLeaving Helper
        nc.remove(permAddr, function (err, result) {
            if (err)
                dev._removing = false;
            callback(err, result);
        });
    }
};

drvApis.ban = function (ncName, permAddr, callback) {
    var self = this,
        nc = obtainNetcore(this, ncName, callback),
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
};

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.unban(permAddr, callback);
};

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = obtainNetcore(this, ncName, callback);
    if (nc)
        nc.ping(permAddr, callback);
};

drvApis.maintain = function (ncName, permAddr, callback) {
    var self = this,
        dev = obtainDevice(this, ncName, permAddr, callback),
        gadTable;

    if (dev) {
        gadTable = dev.get('gadTable');
        dev.refresh(callback);
    }
};

/*************************************************************************************************/
/*** Device Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.devEnable = function (ncName, permAddr, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        try {
            dev.enable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.devDisable = function (ncName, permAddr, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev) {
        try {
            dev.disable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.devRead = function (ncName, permAddr, attr, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.read(attr, callback);
};

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.write(attr, val, callback);
};

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var dev = obtainDevice(this, ncName, permAddr, callback);
    if (dev)
        dev.identify(callback);
};

/*************************************************************************************************/
/*** Gadget Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.read(attr, callback);
};

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.write(attr, val, callback);
};

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.exec(attr, args, callback);
};

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, attrName, cfg, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.setReportCfg(attrName, cfg, callback);
};

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, attrName, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad)
        gad.getReportCfg(attrName, callback);
};

drvApis.gadEnable = function (ncName, permAddr, auxId, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad) {
        try {
            gad.enable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.gadDisable = function (ncName, permAddr, auxId, callback) {
    var gad = obtainGadget(freebird, ncName, permAddr, auxId, callback);
    if (gad) {
        try {
            gad.disable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

/*************************************************************************************************/
/*** Helpers                                                                                   ***/
/*************************************************************************************************/
function obtainNetcore(freebird, ncName, callback) {
    validate.fn(callback);
    var nc = freebird.find('netcore', ncName);
    if (!nc) {
        process.nextTick(function () {
            callback(new Error('netcore not found.'));
        });
    }
    return nc;
}

function obtainDevice(freebird, ncName, permAddr, callback) {
    var nc = obtainNetcore(freebird, ncName, callback),
        dev = nc ? freebird.findFromNetcore(ncName, 'device', permAddr) : undefined;

    if (nc && !dev) {
        process.nextTick(function () {
            callback(new Error('device not found.'));
        });
    }
    return dev;
}

function obtainGadget(freebird, ncName, permAddr, auxId, callback) {
    var nc = obtainNetcore(freebird, ncName, callback),
        gad = nc ? freebird.findFromNetcore(ncName, 'gadget', permAddr, auxId) : undefined;

    if (nc && !gad) {
        process.nextTick(function () {
            callback(new Error('gadget not found.'));
        });
    }
    return gad;
}

module.exports = drvApis;
