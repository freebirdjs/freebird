var EventEmitter = require('events'),
    util = require('util');

var _ = require('lodash'),
    fbbs = require('freebird-base'),
    Fbws = require('freebird-websocket');

var Device = fbbs.Device,
    Gadget = fbbs.Gadget,
    Netcore = fbbs.Netcore,
    Storage = require('./components/storage'),
    loader = require('./components/object_loader');

var wsApis = require('./components/ws_apis'),
    drvApis = require('./components/driver_apis'),
    ncListeners = require('./components/nc_event_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

function Freebird(httpServer) {
    if (!(this instanceof Freebird))
        return new Freebird(httpServer);

    EventEmitter.call(this);

    this._httpServer = httpServer || null;
    this._wsServer = null;

    this._plugins = [];

    this._netcores = [];
    this._devbox = new Storage(devboxPath, 6000);
    this._gadbox = new Storage(gadboxPath, 18000);

    this._wsApis = {};              // bind websocket net, dev, and gad methods by bindWsApis()
    this.net = {};                  // bind driver methods by bindDrivers()
    thie.dev = {};
    this.gad = {};
    this._ncEventListeners = {};    // to manage all inner listeners

    bindWsApis(this);
    bindDrivers(this);
    attachEventListeners(this);

    // init web service (websocket)
    if (this._httpServer) {
        this._wsServer = new Fbws(this);
        this._wsServer.start(this.httpServer);
    }

    // [TODO]
    this.authenticate = function () {};
    this.authorize = function () {};
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Freebird.prototype._getHttpServer = function () {
    return this._httpServer;
};

Freebird.prototype._getWsServer = function () {
    return this._wsServer;
};

Freebird.prototype._emitws= function (evt, fbMsg, wsMsg) {
    // pass event to ws-server
    if (this._wsServer) {
        try {
            this._wsServer.receiveFbEvt(evt, wsMsg);
        } catch (e) {
            console.log(e); // log: handler not found
        }
    }

    this.emit(evt, fbMsg);
};

Freebird.prototype._ncInstance = function (nc) {
    var netcore;

    if (nc instanceof Netcore)
        netcore = nc;
    else if (_.isString(nc))
        netcore = this.getNetcore(nc);

    return netcore;
};

Freebird.prototype._devInstance = function (dev) {
    var device;

    if (dev instanceof Device)
        device = dev;
    else if (_.isNumber(dev))
        device = this.findDevById(dev);

    return device;
};

Freebird.prototype._gadInstance = function (gad) {
    var gadget;

    if (gad instanceof Gadget)
        gadget = gad;
    else if (_.isNumber(gad))
        gadget = this.findGadById(gad);

    return gadget;
};

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
// getters
Freebird.prototype.getNetcore = function (ncName) {
    return _.find(this._netcores, function (core) {
        return core.getName() === ncName;
    });
};

Freebird.prototype.findDev = function (pred) {
    return this._devbox.find(pred);
};

Freebird.prototype.findGad = function (pred) {
    return this._gadbox.find(pred);
};

Freebird.prototype.findDevById = function (id) {
    return this._devbox.get(id);
};

Freebird.prototype.findDevByAddr = function (ncName, permAddr) {
    return this.findDev(function (dev) {
        return (dev.getPermAddr() === permAddr) && (dev.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.findGadById = function () {
    return this._gadbox.get(id);
};

Freebird.prototype.findGadByAddrAuxId = function (ncName, permAddr, auxId) {
    return this.findGad(function (gad) {
        return (gad.getPermAddr() === permAddr) && (gad.getAuxId() === auxId) && (gad.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.getAllDevs = function (ncName) {
    var nc = this._ncInstance(ncName);

    if (ncName) {
        return this._devbox.filter(function (dev) {
            return dev.getNetcore() === nc;
        });
    } else {
        return this._devbox.exportAllObjs();
    }
};

Freebird.prototype.getAllGads = function (ncName) {
    var nc = this._ncInstance(ncName);

    if (ncName) {
        return this._gadbox.filter(function (gad) {
            return gad.getNetcore() === nc;
        });
    } else {
        return this._gadbox.exportAllObjs();
    }
};

Freebird.prototype.getBlacklist = function (ncName) {
    var blackList,
        nc = this._ncInstance(ncName);

    if (nc)
        blackList = nc.getBlacklist();

    return blackList;   // undefined if no such netcore
};

Freebird.prototype.registerNetcore = function (nc, callback) {
    var self = this,
        ncName;

    if (!(nc instanceof Netcore))
        return callback(new Error('Not a netcore, cannot register to freebird.'));

    ncName = nc.getName();

    if (!this.getNetcore(ncName))
        this._netcores.push(nc);

    loader.reload(this, ncName, function (err, ids) {
        // no matter error or not, we did reload
        self.net.start(ncName, function (err) { // start netcore
            if (err) {
                loader.unload(self, ncName);
                self.emit('RELOAD_FAILS');  // [TODO] event?
            } else {
                self.emit('RELOADED');      // [TODO] event?
            }
        });
    });

    return this;
};

Freebird.prototype.unregisterNetcore = function (nc, callback) {
    var self = this,
        err,
        ncName;

    if (_.isString(nc)) {
        ncName = nc;
        nc = this.getNetcore(ncName);
    } else if (nc instanceof Netcore) {
        ncName = nc.getName();
    } else {
        err = new Error('Netcore not found.');
    }

    if (err) {
        callback(err);
    } else {
        // disable netcore
        this.net.stop(ncName, function (err) {
            if (!err)
                loader.unload(self, ncName, function (err) {
                    // [TODO]
                });
        });

        // remove netcore
        _.remove(this._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    }
    return this;
};

Freebird.prototype.registerDev = function (dev, callback) {
    var oldDev;

    dev = this._devInstance(dev);   // dev can be number or device instance
    callback = callback || function (err) { console.log(err); };

    if (dev && dev.getId())
        oldDev = this.findDevById(dev.getId());

    if (!dev) {
        callback(new Error('dev is not an instance of Device class.'));
    } else if (oldDev) {
        callback(new Error('dev exists, unregister it first.'));
    } else if (dev._recovered) {
        this._devbox.set(dev.getId(), dev, function (err, id) {
            if (!err) {
                dev._recovered = false;
                delete dev._recovered;
            }
            callback(err, id);
        });
    } else {
        dev.setNetInfo({
            joinTime: Math.floor(Date.now()/1000)
        });

        this._devbox.add(dev, function (err, id) {
            if (!err)
                dev._setId(id); // set id to dev, registered successfully

            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype.unregisterDev = function (dev, callback) {
    var self = this,
        oldDev,
        gads;

    dev = this._devInstance(dev);
    callback = callback || function (err) { console.log(err); };

    if (!dev) {
        callback(new Error('dev is not found or not a instance of Device class.'));
    } else {
        this._devbox.remove(dev.getId(), function (err) {
            // unregister gadgets - 'gadLeaving' will be emitted@'devLeaving' handler
            // let gadLeaving handler do the unregisteration
            callback(err);
        });
    }

    return this;
};

Freebird.prototype.registerGad = function (gad, callback) {
    var oldGad;

    callback = callback || function (err) { console.log(err); };

    if (gad.getId())
        oldGad = this.findGadById(gad.getId());

    if (oldGad) {
        callback(new Error('gad exists, unregister it first.'));
    } else if (gad._recovered) {    // it was registered before, for recovery from database
        this._gadbox.set(gad.getId(), gad, function (err, id) {
            if (!err) {
                gad._recovered = false;
                delete gad._recovered;
            }
            callback(err, id);
        });
    } else {
        this._gadbox.add(gad, function (err, id) {
            var dev = gad.getDev();
            if (!err) {
                gad._setId(id);
                dev._setGadIdToAuxId(id, gad.getAuxId());
            }

            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype.unregisterGad = function (gad, callback) {
    var gadId,
        auxId;

    gad = this._gadInstance(gad);
    callback = callback || function (err) { console.log(err); };

    if (!gad) {
        callback(new Error('gadget is not found or not an instance of Gadget class.'));
    } else {
        gadId = gad.getId();
        auxId = gad.getAuxId();

        this._gadbox.remove(gadId, function (err) {
            var dev = gad.getDev();
            if (!err) {
                if (dev)    // this gad is not an orphan
                    dev._unlinkGad(gadId, auxId);

                gad.disable();
                gad._clear();
                gad = null;
            }

            callback(err);
        });

    }
    return this;
};

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
        identify: wsApis.devIdentify.bind(fb),
        enable: wsApis.devEnable.bind(fb),
        disable: wsApis.devDisable.bind(fb)
    };

    fb._wsApis.gad = {
        read: wsApis.gadRead.bind(fb),
        write: wsApis.gadWrite.bind(fb),
        exec: wsApis.gadExec.bind(fb),
        setReportCfg: wsApis.gadSetReportCfg.bind(fb),
        getReportCfg: wsApis.gadGetReportCfg.bind(fb),
        enable: wsApis.gadEnable.bind(fb),
        disable: wsApis.gadDisable.bind(fb)
    };
}

function bindDrivers(fb) {
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
        // maintain: drvApis.maintain.bind(fb), [No driver?]
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
}

function attachEventListeners(fb) {
    var ncLsns = fb._ncEventListeners;

    _.forEach(ncListeners, function (lsn, key) {
        ncLsns[key] = lsn.bind(fb);
    });

    fb.on('_nc:ready', ncLsns.ncReady);                             // {}

    fb.on('_nc:error', ncLsns.ncError);                             // { error: err }
    fb.on('_nc:permitJoin', ncLsns.ncPermitJoin);                   // { timeLeft: self._joinTicks }
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

    fb.on('_dev:error', ncLsns.devError);                           // { error: err }
    fb.on('_dev:netChanged', ncLsns.devNetChanged);                 // { data: delta }, setNetInfo
    fb.on('_dev:propsChanged', ncLsns.devPropsChanged);             // { data: delta }, setProps
    fb.on('_dev:attrsChanged', ncLsns.devAttrsChanged);             // { data: delta }, setAttrs

    // fb.on('_gad:error');                                         // { error: err }
    fb.on('_gad:panelChanged', ncLsns.gadPanelChanged);             // { data: delta }, setPanelInfo
    fb.on('_gad:propsChanged', ncLsns.gadPropsChanged);             // { data: delta }, setProps
    fb.on('_gad:attrsChanged', ncLsns.gadAttrsChanged);             // { data: delta }, setAttrs
}


module.exports = Freebird;
