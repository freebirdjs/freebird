var drvApis = {};

/***********************************************************************/
/*** net, dev, and gad drivers                                       ***/
/***********************************************************************/
drvApis.start = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.start(callback);
};

drvApis.stop = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.stop(callback);
};

drvApis.reset = function (ncName, mode, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.reset(mode, callback);
};

drvApis.permitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.permitJoin(duration, callback);
};

drvApis.remove = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName),
        dev = this.findDevByAddr(ncName, permAddr);

    if (!nc) {
        return callback(new Error('netcore not found.'));
    } else {
        if (dev)
            dev._removing = true;   // devLeaving Helper

        return nc.remove(permAddr, function (err, result) {
            if (err)
                dev._removing = false;

            callback(err, result);
        });
    }
};

drvApis.ban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.ban(permAddr, callback);
};

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.unban(permAddr, callback);
};

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.unban(permAddr, callback);
};

drvApis.devRead = function (ncName, permAddr, attr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.read(attr, callback);
};

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.write(attr, val, callback);
};

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var dev = this.findDevByAddr(ncName, permAddr);

    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.identify(callback);
};

drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.read(attr, callback);
};

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.write(attr, val, callback);
};

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.exec(attr, args, callback);
};

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, cfg, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.setReportCfg(attr, cfg, callback);
};

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, callback) {
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);

    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.getReportCfg(attr, callback);
};

module.exports = drvApis;
