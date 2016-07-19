/* jshint node: true */
'use strict';

var drvApis = {};

drvApis.bindDrivers = function (fb) {
    fb.net = {
        start: drvApis.start.bind(fb),
        stop: drvApis.stop.bind(fb),
        enable: drvApis.enable.bind(fb),
        disable: drvApis.disable.bind(fb),
        reset: drvApis.reset.bind(fb),
        permitJoin: drvApis.permitJoin.bind(fb),
        remove: drvApis.remove.bind(fb),
        ban: drvApis.ban.bind(fb),
        unban: drvApis.unban.bind(fb),
        ping: drvApis.ping.bind(fb),
        // maintain: drvApis.maintain.bind(fb), [No driver?] [TODO]
    };

    fb.dev = {
        read: drvApis.devRead.bind(fb),
        write: drvApis.devWrite.bind(fb),
        identify: drvApis.devIdentify.bind(fb),
        enable: drvApis.devEnable.bind(fb),
        disable: drvApis.devDisable.bind(fb)
    };

    fb.gad = {
        read: drvApis.gadRead.bind(fb),
        write: drvApis.gadWrite.bind(fb),
        exec: drvApis.gadExec.bind(fb),
        setReportCfg: drvApis.gadSetReportCfg.bind(fb),
        getReportCfg: drvApis.gadGetReportCfg.bind(fb),
        enable: drvApis.gadEnable.bind(fb),
        disable: drvApis.gadDisable.bind(fb)
    };
};

// [TODO] should have a good log scheme
// some apis need no callback
var innerCallback = function (err) {    // if callback not given, use this instead
    console.log(err);
};

/***********************************************************************/
/*** net, dev, and gad drivers                                       ***/
/***********************************************************************/
drvApis.start = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.start(callback);
};

drvApis.stop = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.stop(callback);
};

drvApis.enable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        try {
            nc.enable();
            callback(null, nc.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.disable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        try {
            nc.disable();
            callback(null, nc.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.reset = function (ncName, mode, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.reset(mode, callback);
};

drvApis.permitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.permitJoin(duration, callback);
};

drvApis.remove = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName),
        dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        if (dev)
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
        nc = this.getNetcore(ncName),
        dev = this.findDevByAddr(ncName, permAddr),

    callback = callback || innerCallback;

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        nc.ban(permAddr, function (err, result) {
            if (err) {
                callback(err);
            } else {
                self.unregisterDev(dev, function (err) {
                    if (err)
                        callback(err);
                    else
                        callback(null, {});
                });
            }
        });
    }
};

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.unban(permAddr, callback);
};

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    callback = callback || innerCallback;

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.ping(permAddr, callback);
};

drvApis.devEnable = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.enable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.devDisable = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.disable();
            callback(null, dev.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.devRead = function (ncName, permAddr, attr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.read(attr, callback);
};

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.write(attr, val, callback);
};

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    callback = callback || innerCallback;

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.identify(callback);
};

drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.read(attr, callback);
};

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.write(attr, val, callback);
};

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.exec(attr, args, callback);
};

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, attrName, cfg, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.setReportCfg(attrName, cfg, callback);
};

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, attrName, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.getReportCfg(attrName, callback);
};

drvApis.gadEnable = function (ncName, permAddr, auxId, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            gad.enable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

drvApis.gadDisable = function (ncName, permAddr, auxId, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    callback = callback || innerCallback;

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            gad.disable();
            callback(null, gad.isEnabled());
        } catch (e) {
            callback(e);
        }
    }
};

module.exports = drvApis;
