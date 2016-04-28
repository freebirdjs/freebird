var EventEmitter = require('events'),
    util = require('util');

var _ = require('lodash'),
    fbbase = require('freebird-base'),
    Fbws = require('freebird-websocket');

var Storage = require('Storage'),
    wsApis = require('./components/ws_apis'),
    drvApis = require('./components/driver_apis'),
    ncListeners = require('./components/nc_event_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

function Freebird(httpServer) {
    this._plugins = [];
    this._devbox = new Storage(devboxPath, 6000);
    this._gadbox = new Storage(gadboxPath, 18000);
    this._netcores = [];
    this._httpServer = httpServer || null;
    this._wsServer = null;

    this._ncEventListeners = {};
    this._wsApis = {};    // bind net, dev, and gad methods by bindWsApis()
    this.net = {};      // bind methods by bindDrivers()
    thie.dev = {};
    this.gad = {};

    bindWsApis(this);
    bindDrivers(this);
    attachEventListeners(this);

    // init web service
    if (this._httpServer) {
        this._wsServer = new Fbws(this);
        this._wsServer.start(this.httpServer);
    }
}

util.inherits(Freebird, EventEmitter);

Freebird.prototype._getHttpServer = function () {
    return this._httpServer;
};

Freebird.prototype._getWsServer = function () {
    return this._wsServer;
};

Freebird.prototype._emitws= function (evt, fbMsg, wsMsg) {
    var wsCbName = evt + 'Hdlr',
        wsCallback = this._wsServer ? this._wsServer[wsCbName] : undefined;

    if (wsCallback)
        wsCallback(wsMsg);

    this.emit(evt, fbMsg);
// permitJoinHdlr
// netChangedHdlr
// statusChangedHdlr
// devIncomingHdlr
// devLeavingHdlr
// gadIncomingHdlr
// gadLeavingHdlr
// attrReportHdlr
// devAttrsChangedHdlr
// gadAttrsChangedHdlr
};

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
Freebird.prototype.getNetcore = function (ncName) {
    return this._netcores.find(function (core) {
        return core.getName() === ncName;
    });
};

Freebird.prototype.findDev = function (pred) {
    return this._devbox.find(pred);
};

Freebird.prototype.findGad = function (pred) {
    return this._gadbox.find(pred);
};

Freebird.prototype.findDevByAddr = function (ncName, permAddr) {
    return this.findDev(function (dev) {
        return (dev.getPermAddr() === permAddr) && (dev.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.findGadByAddrAuxId = function (ncName, permAddr, auxId) {
    return this.findGad(function (gad) {
        return (gad.getPermAddr() === permAddr) && (gad.getAuxId() === auxId) && (gad.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.findDevById = function (id) {
    return this._devbox.get(id);
};

Freebird.prototype.findGadById = function () {
    return this._gadbox.get(id);
};

Freebird.prototype.findWsApi = function (namespace, apiName) {
    var space = this._wsApis[namespace];
    return space ? space[apiName] : undefined;
};

Freebird.prototype.registerNetcore = function (nc) {
    if (!(nc instanceof fbbase.Netcore))
        throw new Error('not a netcore');   // [TODO] throw?

    if (!this.hasNetcore(nc)) {
        // push to this._netcores
    }

    // reload devices and gadgets of this netcore from database
    // call netcore.start

    return this._gadbox.get(id);
};

Freebird.prototype.unregisterNetcore = function (nc, callback) {

};

Freebird.prototype.registerDev = function (dev, callback) {
    // set jointime
    // save to db
    // fb._devbox.add(devIn, function (err, newId) { devIn._setId(newId) });
    // poke

    if (callback)
        callback();
};

Freebird.prototype.unregisterDev = function (dev, callback) {
    // remove from box
    // emit dev Leaving

    if (callback)
        callback();
};

Freebird.prototype.registerGad = function (gad, callback) {
    // remove from box
    // emit gad Leaving

    if (callback)
        callback();
};

Freebird.prototype.unregisterGad = function (gad, callback) {
    // remove from box
    // emit gad Leaving
    if (callback)
        callback();
};


// Freebird.prototype.getAllGads = function (nc) {};
// Freebird.prototype.updateDevAttrs = function () {};
// Freebird.prototype.updateGadAttrs = function () {};
// Freebird.prototype.getDevIdsInNetcore = function (core) {};
// Freebird.prototype.getBlacklistInNetcore = function (core) {};
// Freebird.prototype.maintain = function (core) {};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
function bindWsApis(fb) {
    fb._wsApis.net = {
        getAllDevIds: wsApis.getAllDevIds.bind(fb),
        getAllGadIds: wsApis.getAllGadIds.bind(fb),
        getDevs: wsApis.getDevs.bind(fb),
        getGads: wsApis.getGads.bind(fb),
        getNetcores: wsApis.getNetcores.bind(fb),
        getBlacklist: wsApis.getBlacklist.bind(fb),
        permitJoin: wsApis.permitJoin.bind(fb),
        maintain: wsApis.maintain.bind(fb),
        reset: wsApis.reset.bind(fb), 
        enable: wsApis.enable.bind(fb), 
        disable: wsApis.disable.bind(fb),  
        ban: wsApis.ban.bind(fb), 
        unban: wsApis.unban.bind(fb), 
        remove: wsApis.remove.bind(fb), 
        ping: wsApis.ping.bind(fb)
    };

    fb._wsApis.dev = {
        read: wsApis.devRead.bind(fb),
        write: wsApis.devWrite.bind(fb),
        identify: wsApis.devIdentify.bind(fb)
    };

    fb._wsApis.gad = {
        read: wsApis.gadRead.bind(fb),
        write: wsApis.gadWrite.bind(fb),
        exec: wsApis.gadExec.bind(fb),
        setReportCfg: wsApis.gadSetReportCfg.bind(fb),
        getReportCfg: wsApis.gadGetReportCfg.bind(fb)
    };
}

function bindDrivers(fb) {
    fb.net = {
        start: drvApis.start.bind(fb),
        stop: drvApis.stop.bind(fb),
        reset: drvApis.reset.bind(fb),
        permitJoin: drvApis.permitJoin.bind(fb),
        remove: drvApis.remove.bind(fb),
        ban: drvApis.ban.bind(fb),
        unban: drvApis.unban.bind(fb),
        ping: drvApis.ping.bind(fb),
        // maintain: drvApis.start.bind(fb), [No driver?]
        // enable
        // diable
    };

    fb.dev = {
        read: drvApis.devRead.bind(fb),
        write: drvApis.devWrite.bind(fb),
        identify: drvApis.devIdentify.bind(fb)
    };

    fb.gad = {
        read: drvApis.gadRead.bind(fb),
        write: drvApis.gadWrite.bind(fb),
        exec: drvApis.gadExec.bind(fb),
        setReportCfg: drvApis.gadSetReportCfg.bind(fb),
        getReportCfg: drvApis.gadGetReportCfg.bind(fb)
    };
}

function attachEventListeners(fb) {
    var ncLsns = fb._ncEventListeners;

    _.forEach(ncListeners, function (lsn, key) {
        ncLsns[key] = lsn.bind(fb);
    });

    fb.on('_nc:error', ncLsns.ncError);             // { error: err }
    fb.on('_nc:permitJoin', ncLsns.ncPermitJoin);   // { timeLeft: self._joinTicks }
    fb.on('_nc:started', ncLsns.ncStarted);
    fb.on('_nc:stopped', ncLsns.ncStopped);
    fb.on('_nc:enabled', ncLsns.ncEnabled);
    fb.on('_nc:disabled', ncLsns.ncDisabled);
    fb.on('_nc:devIncoming', ncLsns.ncDevIncoming);                 // { permAddr: permAddr, raw: rawDev }
    fb.on('_nc:bannedDevIncoming', ncLsns.ncBannedDevIncoming);     // { permAddr: permAddr, raw: rawDev }
    fb.on('_nc:devLeaving', ncLsns.ncDevLeaving);                   // { permAddr: permAddr }
    fb.on('_nc:gadIncoming', ncLsns.ncGadIncoming);                 // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    fb.on('_nc:gadLeaving', ncLsns.ncGadLeaving);                   // { gad: gad }, internal event, not pass from low-level
    fb.on('_nc:bannedGadIncoming', ncLsns.ncBannedGadIncoming);     // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    fb.on('_nc:devReporting', ncLsns.ncDevReporting);               // { permAddr: permAddr, data: devAttrs }
    fb.on('_nc:bannedDevReporting', ncLsns.ncBannedDevReporting);   // { permAddr: permAddr, data: devAttrs }
    fb.on('_nc:gadReporting', ncLsns.ncGadReporting);               // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    fb.on('_nc:bannedGadReporting', ncLsns.ncBannedGadReporting);   // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }

    fb.on('_dev:error', ncLsns.devError);                   // { error: err }
    fb.on('_dev:netChanged', ncLsns.devNetChanged);         // { data: delta }, setNetInfo
    fb.on('_dev:propsChanged', ncLsns.devPropsChanged);     // { data: delta }, setProps
    fb.on('_dev:attrsChanged', ncLsns.devAttrsChanged);     // { data: delta }, setAttrs

    // fb.on('_gad:error');         // { error: err }
    fb.on('_gad:panelChanged', ncLsns.gadPanelChanged);     // { data: delta }, setPanelInfo
    fb.on('_gad:propsChanged', ncLsns.gadPropsChanged);     // { data: delta }, setProps
    fb.on('_gad:attrsChanged', ncLsns.gadAttrsChanged);     // { data: delta }, setAttrs
}

module.exports = Freebird;
