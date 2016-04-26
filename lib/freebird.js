var EventEmitter = require('events'),
    _ = require('lodash');

var Storage = require('Storage');

var fb = {};

function Freebird() {
    this._plugins = [];
    this._devbox = new Storage();
    this._gadbox = new Storage();
    this._netcores = [];

    this._wsApis = {
        net: {
            getAllDevIds: null,
            getAllGadIds: null,
            getDevs: null,
            getGads: null,
            getNetcores: null,
            getBlacklist: null,
            permitJoin: null,   // duplicated
            maintain: null,
            reset: null,        // duplicated
            enable: null,
            disable: null,
            ban: null,          // duplicated
            unban: null,        // duplicated
            remove: null,       // duplicated
            ping: null          // duplicated
        },
        dev: {
            read: null,         // duplicated
            write: null,        // duplicated
            identify: null,     // duplicated
        },
        gad: {
            read: null,         // duplicated
            write: null,        // duplicated
            exec: null,         // duplicated
            setReportCfg: null, // duplicated
            getReportCfg: null  // duplicated
        }
    };

    this.net = {
        start: this._ncStart,           // function(ncName, callback) {}
        stop: this._ncStop,             // function(ncName,callback) {}
        reset: this._ncReset,           // function(ncName, mode, callback) {}
        permitJoin: this._ncPermitJoin, // function(ncName, duration, callback) {}
        remove: this._ncRemove,         // function(ncName, permAddr, callback) {}
        ban: this._ncBan,               // function(ncName, permAddr, callback) {}
        unban: this._ncUnban,           // function(ncName, permAddr, callback) {}
        ping: this._ncPing,              // function(ncName, permAddr, callback) {}
        // maintain: null, [No driver?]
        // enable
        // diable

    };
    this.dev = {
        read: this._devRead,            // function(ncName, permAddr, attr, callback) {}
        write: this._devWrite,          // function(ncName, permAddr, attr, val, callback) {}
        identify: this._devIdentify,    // function(ncName, permAddr, callback) {}
    };
    this.gad = {
        read: this._gadRead,                    // function(ncName, permAddr, auxId, attr, callback) {}
        write: this._gadWrite,                  // function(ncName, permAddr, auxId, attr, val, callback) {}
        exec: this._gadExec,                    // function(ncName, permAddr, auxId, attr, args, callback) {}
        setReportCfg: this._gadSetReportCfg,    // function(ncName, permAddr, auxId, cfg, callback) {}
        getReportCfg: this._gadGetReportCfg,    // function(ncName, permAddr, auxId, callback) {}
    };
}

util.inherits(Freebird, EventEmitter);
module.exports = Freebird;

/***********************************************************************/
/*** APIs for web client (websocket)                                 ***/
/***********************************************************************/
Freebird.prototype._wsNetGetAllDevIds = function (ncName, callback) { // [ncName]
    var nc = this.getNetcore(ncName),
        devIds = [];

    if (_.isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (!ncName) {
        devIds = this._devbox.exportAllIds();
    } else {
        devIds = this._devbox.filter('_netcore', nc);
        devIds = devIds.map(function (dev) {
            return dev.getId();
        });
    }

    callback(null, { ids: devIds });
    // return { ids: [ 1, 2, 3, 8, 12 ] }
};

Freebird.prototype._wsNetGetAllGadIds = function (ncName, callback) { // [ncName]
    var nc = this.getNetcore(ncName),
        gadIds = [];

    if (_.isFunction(ncName)) {
        callback = ncName;
        ncName = undefined;
    }

    if (!ncName) {
        gadIds = this._gadbox.exportAllIds();
    } else {
        gadIds = this._gadbox.filter('_netcore', nc);
        gadIds = gadIds.map(function (gad) {
            return gad.getId();
        });
    }

    callback(null, { ids: gadIds });
    // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] }
};

Freebird.prototype._wsNetGetDevs = function (ids, callback) {
    var self = this,
        devs;
    // [TODO] devInfo format

    if (_.isFunction(ids)) {
        callback = ids;
        ids = undefined;
    }

    devs = ids.map(function (id) {
        var dev = self._devbox.get(id);
        if (dev)
            return dev._dumpDevInfo();
        else
            return;
    });

    callback(null, { devs: devs });
    // return { devs: [ devInfo, ... ] }
};

Freebird.prototype._wsNetGetGads = function (ids, callback) {
    var self = this,
        gads;

    // [TODO] gadInfo format

    if (_.isFunction(ids)) {
        callback = ids;
        ids = undefined;
    }

    gads = ids.map(function (id) {
        var gad = self._gadbox.get(id);
        if (gad)
            return gad._dumpGadInfo();
        else
            return;
    });

    callback(null, { gads: gads });

    // return { gads: [ gadInfo , ... ] }
};

Freebird.prototype._wsNetGetNetcores = function (ncNames, callback) {
    // [TODO] ncInfo format
    var self = this;
    var ncs = ncNames.map(function (name) {
        var nc = self.getNetcore(name);
        if (nc)
            return nc._dumpNcInfo();
        else 
            return;
    });

    callback(null, { netcores: ncs });
    // return { netcores: [ ncInfo, ... ] }
};

Freebird.prototype._wsNetGetBlacklist = function (ncName, callback) {
    var nc = this.getNetcore(ncName),
        blist;

    if (nc)
        blist = nc.getBlacklist();
    else
        blist = []; // err??

    callback(null, { list: blist });
    // return { list: [ '0x00124b0001ce4b89', ... ] }
};

Freebird.prototype._wsNetPermitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);

    nc.permitJoin(duration, function (err) {
        callback(err, {});
    });

    // return {}
};

Freebird.prototype._wsNetMaintain = function (ncName, callback) {
    // [TODO] no driver?
    // return {}
};

Freebird.prototype._wsNetReset = function (ncName, callback) {
    var nc = this.getNetcore(ncName),
        HARD_RESET = 1;

    nc.reset(HARD_RESET, function (err) {
        callback(err, {});
    });

    // return {}
};

Freebird.prototype._wsNetEnable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    try {
        nc.enable();
        callback(null, {});
    } catch (e) {
        callback(e, {});
    }
    // return {}
};

Freebird.prototype._wsNetDisable = function (ncName, callback) {
    var nc = this.getNetcore(ncName);

    try {
        nc.disable();
        callback(null, {});
    } catch (e) {
        callback(e, {});
    }

    // return {}
};

Freebird.prototype._wsNetBan = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (nc)
        nc.ban(permAddr, callback);
    else
        callback(); // not found
    // return {}
};

Freebird.prototype._wsNetUnban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);

    if (nc)
        nc.unban(permAddr, callback);
    else
        callback(); // not found
    // return {}
};

Freebird.prototype._wsNetRemove = function (id, callback) {
    var nc = this.getNetcore(ncName),
        dev = this.findDevById(id),
        permAddr;

    if (dev)
        permAddr = dev.getPermAddr();

    nc.remove(permAddr, function (err, perm) {
        callback(err, { permAddr: perm });  // [TODO] remove return perm?
    });

    // return { permAddr: '0x00124b0001ce4b89' }
};

Freebird.prototype._wsNetPing = function (id, callback) {
    var dev = this.findDevById(id);

    if (dev)
        dev.ping(function (err, time) {
            callback(err, { time: time });
        });
    else
        callback();     //not found

    // return { time: 12 }
};

Freebird.prototype._wsDevRead = function (id, attrName, callback) {
    var dev = this.findDevById(id);

    if (dev)
        dev.read(attrName, function (err, val) {
            callback(err, { value: val });
        });
    else
        callback();     //not found

    // return { value: 3 }
};

Freebird.prototype._wsDevWrite = function (id, attrName, value, callback) {
    var dev = this.findDevById(id);

    if (dev)
        dev.write(attrName, value, function (err, val) {
            callback(err, { value: val });
        });
    else
        callback();     //not found
    // return { value: 'kitchen' }
};

Freebird.prototype._wsDevIdentify= function (id, callback) {
    var dev = this.findDevById(id);

    if (dev)
        dev.identify(function (err, val) {
            callback(err, {});
        });
    else
        callback();     //not found
    // return {}
};

Freebird.prototype._wsGadRead= function (id, attrName, callback) {
    var gad = this.findGadById(id);

    if (gad)
        gad.read(attrName, function (err, val) {
            callback(err, { value: val });
        });
    else
        callback();     //not found
    // return { value: 371.42 }
};

Freebird.prototype._wsGadWrite= function (id, attrName, value, callback) {
    var gad = this.findGadById(id);

    if (gad)
        gad.write(attrName, value, function (err, val) {
            callback(err, { value: val });
        });
    else
        callback();     //not found

    // return { value: false }
};

Freebird.prototype._wsGadExec= function (id, attrName, args, callback) {    // [TODO] args is optional
    var gad = this.findGadById(id);

    if (gad)
        gad.exec(attrName, args, function (err, val) {
            callback(err, { result: val });
        });
    else
        callback();     //not found

    // return { result: 'completed' }
};

Freebird.prototype._wsGadSetReportCfg= function (id, attrName, cfg, callback) {
    var gad = this.findGadById(id);

    if (gad)
        gad.setReportCfg(attrName, cfg, function (err, val) {
            callback(err, {});
        });
    else
        callback();     //not found

    // return {}
};

Freebird.prototype._wsGadGetReportCfg = function (id, attrName, callback) {
    var gad = this.findGadById(id);

    if (gad)
        gad.getReportCfg(attrName, function (err, rptCfg) {
            callback(err, { cfg: rptCfg });
        });
    else
        callback();     //not found

    // return { cfg: rptCfg }
};

/***********************************************************************/
/*** net, dev, and gad drivers                                       ***/
/***********************************************************************/
Freebird.prototype._ncStart = function (ncName, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.start(callback);
};

Freebird.prototype._ncStop = function (ncName, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.stop(callback);
};

Freebird.prototype._ncReset = function (ncName, mode, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.reset(mode, callback);
};

Freebird.prototype._ncPermitJoin = function (ncName, duration, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.permitJoin(duration, callback);
};

Freebird.prototype._ncRemove = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.remove(permAddr, callback);
};

Freebird.prototype._ncBan = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.ban(permAddr, callback);
};

Freebird.prototype._ncUnban = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.unban(permAddr, callback);
};

Freebird.prototype._ncPing = function (ncName, permAddr, callback) {
    var nc = this.getNetcore(ncName);
    if (!nc)
        return callback(new Error('netcore not found.'));
    else
        return nc.unban(permAddr, callback);
};

Freebird.prototype._devRead = function (ncName, permAddr, attr, callback) {
    // use dev instance
    var dev = this.findDevByAddr(ncName, permAddr);
    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.read(attr, callback);
};

Freebird.prototype._devWrite = function (ncName, permAddr, attr, val, callback) {
    // use dev instance
    var dev = this.findDevByAddr(ncName, permAddr);
    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.write(attr, val, callback);
};

Freebird.prototype._devIdentify = function (ncName, permAddr, callback) {
    // use dev instance
    var dev = this.findDevByAddr(ncName, permAddr);
    if (!dev)
        return callback(new Error('dev not found.'));
    else
        return dev.identify(callback);
};

Freebird.prototype._gadRead = function (ncName, permAddr, auxId, attr, callback) {
    // use gad instance
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);
    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.read(attr, callback);
};

Freebird.prototype._gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    // use gad instance
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);
    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.write(attr, val, callback);
};

Freebird.prototype._gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    // use gad instance
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);
    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.exec(attr, args, callback);
};

Freebird.prototype._gadSetReportCfg = function (ncName, permAddr, auxId, cfg, callback) {
    // use gad instance
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);
    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.setReportCfg(attr, cfg, callback);
};

Freebird.prototype._gadGetReportCfg = function (ncName, permAddr, auxId, callback) {
    // use gad instance
    var gad = this.findGadByAddrAuxId(ncName, permAddr, auxId);
    if (!gad)
        return callback(new Error('gad not found.'));
    else
        return gad.getReportCfg(attr, callback);
};

Freebird.prototype.findDevByAddr = function () {

};
Freebird.prototype.findDevById = function () {

};
Freebird.prototype.findGadById = function () {

};
Freebird.prototype.findGadByAddrAuxId = function () {

};
Freebird.prototype.getAllGads = function (nc) {

};
Freebird.prototype.updateDevAttrs = function () {

};
Freebird.prototype.updateGadAttrs = function () {

};
Freebird.prototype.getNetcore = function (core) { };
Freebird.prototype.getDevIdsInNetcore = function (core) { };
Freebird.prototype.getBlacklistInNetcore = function (core) { };
Freebird.prototype.maintain = function (core) { };


/***********************************************************************/
/*** simen's part: pseudo code here                                  ***/
/*** Put all Device and Gadget work from netcore to freebird         ***/
/***********************************************************************/
fb.on('_nc:error', function (msg) {
    // {
    //    netcore: Object,
    //    error: Error
    // }
    _ncErrorHdlr(msg);
});

fb.on('_nc:enabled', function (msg) {
    // { netcore: Object }
    _ncEnabledHdlr(msg);
});

fb.on('_nc:disabled', function (msg) {
    // { netcore: Object }
    _ncDisabledHdlr(msg);
});

fb.on('_nc:devIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    raw: device raw data
    // }
    _ncDevIncomingHdlr(msg);
});

fb.on('_nc:devLeaving', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    // }
    _ncDevLeavingHdlr(msg);
});

fb.on('_nc:gadIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    raw: gad raw data
    // }
    _ncGadIncomingHdlr(msg);
});

fb.on('_nc:devAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    attrs: Object
    // }
    _ncDevAttrsReportHdlr(msg);
});

fb.on('_nc:gadAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    _ncGadAttrsReportHdlr(msg);
});

// (1) dev status changed
// (2) dev enabled
// (3) gad enabled

function ncErrorHdlr(msg) {
    // err, err.info = { netcore: ncName }
    //-- { netcore: nc, error: err }
}
function ncStartedHdlr(msg) {
    // { netcore: nc }
}
function ncStoppedHdlr(msg) {
    // { netcore: nc }
}
function ncEnabledHdlr(msg) {
    // { netcore: nc }
}
function ncDisabledHdlr(msg) {
    // { netcore: nc }
}
function ncPermitJoinHdlr(msg) {
    // { netcore: nc, timeLeft: ticks }
}
function ncDevIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
}
function ncBannedDevIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
}
function ncDevLeavingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr }
}
function ncGadIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
}
function ncBannedGadIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
}
function ncDevReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
}
function ncBannedDevReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
}
function ncGadReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
}
function ncBannedGadReportingHdlr(msg) {
    // { netcore: nc, permAddr, auxId: auxId, data: gadAttrs }
}

// netcore
// emit { netcore: this }  < merge data
// self._fbEmit('_nc:error', { error: err });
// self._fbEmit('_nc:permitJoin', { timeLeft: self._joinTicks });
// self._fbEmit('_nc:started');
// self._fbEmit('_nc:stopped');
// this._fbEmit('_nc:enabled');
// self._fbEmit('_nc:disabled');
// this._fbEmit('_nc:devIncoming', { permAddr: permAddr, raw: rawDev }); 

// this._fbEmit('_nc:bannedDevIncoming', { permAddr: permAddr, raw: rawDev }); 
// this._fbEmit('_nc:devLeaving', { permAddr: permAddr });
// this._fbEmit('_nc:gadIncoming', { permAddr: permAddr, auxId: auxId, raw: rawGad });
// this._fbEmit('_nc:bannedGadIncoming', { permAddr: permAddr, auxId: auxId, raw: rawGad });

// this._fbEmit('_nc:devReporting', { permAddr: permAddr, data: devAttrs });
// this._fbEmit('_nc:bannedDevReporting', { permAddr: permAddr, data: devAttrs });
// this._fbEmit('_nc:gadReporting', { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs });
// this._fbEmit('_nc:bannedGadReporting', { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs });
function devErrorHdlr(msg) {
    // err, err.info = { netcore: ncName, dev: id }
}
function devNetChangedHdlr(msg) {
    // { dev: dev, data: { enabled: true } }
    // { dev: dev, data: delta }
    // { dev: dev, data: { traffic: { out: _.cloneDeep(this._net.traffic.out) } } }
}
function devNetChangedHdlr(msg) {
    // { dev: dev, data: { enabled: true } }
}
function devPropsChangedHdlr(msg) {
    // { dev: dev, data: delta }
}
function devAttrsChangedHdlr(msg) {
    // { dev: dev, data: delta }
}
// device
// emitData = isErrEvt ? _.assign(data, { dev: this.getId() }) : _.assign(data, { dev: this });

// this._fbEmit('_dev:netChanged', { data: { enabled: true } });
// this._fbEmit('_dev:netChanged', { data: delta });
// this._fbEmit('_dev:propsChanged', { data: delta });
// this._fbEmit('_dev:attrsChanged', { data: delta });
// this._fbEmit('_dev:netChanged', { data: { traffic: { out: _.cloneDeep(this._net.traffic.out) } } });
// this._fbEmit('_dev:netChanged', { data: { traffic: { in: _.cloneDeep(this._net.traffic.in) } } });
// this._fbEmit('_dev:error', { error: err });

function gadPanelChangedHdlr(msg) {
    // { gad: gad, data: { enabled: true } }
    // { gad: gad, data: delta }
}
function gadPropsChangedHdlr(msg) {
    // { gad: gad, data: delta }
}
function gadAttrsChangedHdlr(msg) {
    // { gad: gad, data: delta }
}
// gadget
// emitData = _.assign(data, { gad: this });
// this._fbEmit('_gad:panelChanged', { data: { enabled: true } });
// this._fbEmit('_gad:panelChanged_Disabled', { data: { enabled: false } });
// this._fbEmit('_gad:panelChanged', { data: delta });
// this._fbEmit('_gad:propsChanged', { data: delta });
// this._fbEmit('_gad:attrsChanged', { data: delta });
