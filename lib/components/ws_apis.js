var wsApis = {};

function isFunction(fn) {
    return (typeof fn === 'function');
}

function isArray(arr) {
    return Array.isArray(arr);
}
/***********************************************************************/
/*** APIs for web client (websocket)                                 ***/
/***********************************************************************/
wsApis.getAllDevIds = function (ncName, callback) { // [ncName]
    var nc,
        devIds;

    if (isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (!ncName) {
        devIds = this._devbox.exportAllIds();
        return callback(null, { ids: devIds });
    }

    nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found..'));

    devIds = this._devbox.filter('_netcore', nc).map(function (dev) {
        return dev.getId();
    });
    callback(null, { ids: devIds });
};  // return { ids: [ 1, 2, 3, 8, 12 ] }

wsApis.getAllGadIds = function (ncName, callback) { // [ncName]
    var nc,
        gadIds;

    if (isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (!ncName) {
        gadIds = this._gadbox.exportAllIds();
        return callback(null, { ids: gadIds });
    }

    nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found..'));

    gadIds = this._gadbox.filter('_netcore', nc).map(function (gad) {
        return gad.getId();
    });
    callback(null, { ids: gadIds });
};  // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] }

wsApis.getDevs = function (ids, callback) {
    var fb = this,
        devs;

    if (!isArray(ids))
        return callback(new Error('ids should be an array'));

    devs = ids.map(function (id) {
        var dev = fb._devbox.get(id);
        return dev ?  dev._dumpDevInfo() : undefined;
    });

    callback(null, { devs: devs });
};  // return { devs: [ devInfo, ... ] }

wsApis.getGads = function (ids, callback) {
    var fb = this,
        gads;

    if (!isArray(ids))
        return callback(new Error('ids should be an array'));

    gads = ids.map(function (id) {
        var gad = fb._gadbox.get(id);
        return gad ? gad._dumpGadInfo() : undefined;
    });

    callback(null, { gads: gads });
};  // return { gads: [ gadInfo , ... ] }

wsApis.getNetcores = function (ncNames, callback) {
    var fb = this,
        ncs;

    if (!isArray(ids))
        return callback(new Error('ncNames should be an array'));

    ncs = ncNames.map(function (name) {
        var nc = fb.getNetcore(name);
        return nc ? nc._dumpNcInfo() : undefined;
    });

    callback(null, { netcores: ncs });
};  // return { netcores: [ ncInfo, ... ] }

wsApis.getBlacklist = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    callback(null, { list: nc.getBlacklist() });
};  // return { list: [ '0x00124b0001ce4b89', ... ] }

wsApis.permitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    nc.permitJoin(duration, function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis.maintain = function (ncName, callback) {
    // [TODO] no driver?
    // return {}
};

wsApis.reset = function (ncName, callback) {
    var nc = this.getNetcore(ncName),
        HARD_RESET = 1;

    if (!nc)
        return callback(new Error('netcore not found.'));

    nc.reset(HARD_RESET, function (err) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis.enable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    try {
        nc.enable();
        callback(null, {});
    } catch (err) {
        callback(err, {});
    }
};  // return {}

wsApis.disable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    try {
        nc.disable();
        callback(null, {});
    } catch (err) {
        callback(err, {});
    }
};  // return {}

wsApis.ban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    nc.ban(permAddr, function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis.unban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (!nc)
        return callback(new Error('netcore not found.'));

    nc.unban(permAddr, function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis.remove = function (id, callback) {
    var dev = this.findDevById(id),
        permAddr = dev ? dev.getPermAddr() : undefined;

    if (!dev)
        return callback(new Error('dev not found.'));

    nc.remove(permAddr, function (err, perm) {
        if (err)
            callback(err);
        else
            callback(null, { permAddr: permAddr });
    });
};  // return { permAddr: '0x00124b0001ce4b89' }

wsApis.ping = function (id, callback) {
    var dev = this.findDevById(id);

    if (!dev)
        return callback(new Error('dev not found.'));

    dev.ping(function (err, time) {
        if (err)
            callback(err);
        else
            callback(null, { time: time });
    });
};  // return { time: 12 }

wsApis.devRead = function (id, attrName, callback) {
    var dev = this.findDevById(id);

    if (!dev)
        return callback(new Error('dev not found.'));

    dev.read(attrName, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, { value: val });
    });
};  // return { value: 3 }

wsApis.devWrite = function (id, attrName, value, callback) {
    var dev = this.findDevById(id);

    if (!dev)
        return callback(new Error('dev not found.'));

    dev.write(attrName, value, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, { value: val });
    });
};  // return { value: 'kitchen' }

wsApis.devIdentify= function (id, callback) {
    var dev = this.findDevById(id);

    if (!dev)
        return callback(new Error('dev not found.'));

    dev.identify(function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis.gadRead= function (id, attrName, callback) {
    var gad = this.findGadById(id);

    if (!gad)
        return callback(new Error('gad not found.'));

    gad.read(attrName, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, { value: val });
    });
};  // return { value: 371.42 }

wsApis.gadWrite= function (id, attrName, value, callback) {
    var gad = this.findGadById(id);

    if (!gad)
        return callback(new Error('gad not found.'));

    gad.write(attrName, value, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, { value: val });
    });
};  // return { value: false }

wsApis.gadExec= function (id, attrName, args, callback) {    // [TODO] args is optional
    var gad = this.findGadById(id);

    if (!gad)
        return callback(new Error('gad not found.'));

    gad.exec(attrName, args, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, { result: val });
    });
};  // return { result: 'completed' }

wsApis.gadSetReportCfg= function (id, attrName, cfg, callback) {
    var gad = this.findGadById(id);

    if (!gad)
        return callback(new Error('gad not found.'));

    gad.setReportCfg(attrName, cfg, function (err, val) {
        if (err)
            callback(err);
        else
            callback(null, {});
    });
};  // return {}

wsApis._wsGadGetReportCfg = function (id, attrName, callback) {
    var gad = this.findGadById(id);

    if (!gad)
        return callback(new Error('gad not found.'));

    gad.getReportCfg(attrName, function (err, rptCfg) {
        if (err)
            callback(err);
        else
            callback(null, { cfg: rptCfg });
    });
};  // return { cfg: rptCfg }

module.exports = wsApis;
