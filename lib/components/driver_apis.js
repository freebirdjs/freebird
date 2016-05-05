var drvApis = {};

/***********************************************************************/
/*** net, dev, and gad drivers                                       ***/
/***********************************************************************/
drvApis.start = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.start(callback);
};

drvApis.stop = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.stop(callback);
};

drvApis.enable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

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

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.reset(mode, callback);
};

drvApis.permitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.permitJoin(duration, callback);
};

drvApis.remove = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName),
        dev = this.findDevByAddr(ncName, permAddr);

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
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.ban(permAddr, callback);
};

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.unban(permAddr, callback);
};

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else
        nc.unban(permAddr, callback);
};

drvApis.devEnable = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

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

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.read(attr, callback);
};

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.write(attr, val, callback);
};

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    if (!dev)
        callback(new Error('dev not found.'));
    else
        dev.identify(callback);
};

drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.read(attr, callback);
};

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.write(attr, val, callback);
};

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.exec(attr, args, callback);
};

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, cfg, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.setReportCfg(attr, cfg, callback);
};

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        callback(new Error('gad not found.'));
    else
        gad.getReportCfg(attr, callback);
};

drvApis.gadEnable = function (ncName, permAddr, auxId, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

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
