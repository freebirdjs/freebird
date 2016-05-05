var EventEmitter = require('events'),
    util = require('util');

var _ = require('lodash'),
    fbbs = require('freebird-base'),
    Fbws = require('freebird-websocket');

var Device = fbbs.Device,
    Gadget = fbbs.Gadget,
    Netcore = fbbs.Netcore,
    Storage = require('./components/storage');

var wsApis = require('./components/ws_apis'),
    drvApis = require('./components/driver_apis'),
    ncListeners = require('./components/nc_event_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

function Freebird(httpServer) {
    if (!(this instanceof Freebird))
        return new Freebird(httpServer);

    this._plugins = [];

    this._devbox = new Storage(devboxPath, 6000);
    this._gadbox = new Storage(gadboxPath, 18000);
    this._netcores = [];
    this._httpServer = httpServer || null;
    this._wsServer = null;

    this._ncEventListeners = {};
    this._wsApis = {};      // bind net, dev, and gad methods by bindWsApis()
    this.net = {};          // bind methods by bindDrivers()
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
    if (this._wsServer)
        this._wsServer.receiveFbEvt(evt, wsMsg);

    this.emit(evt, fbMsg);
};

Freebird.prototype._ncInstance = function (nc) {
    if (nc instanceof Netcore)
        return nc;
    else
        return this.getNetcore(nc);
};

Freebird.prototype._devInstance = function (dev) {
    if (dev instanceof Device)
        return dev;
    else if (_.isNumber(dev))
        return this.findDevById(dev);
};

Freebird.prototype._gadInstance = function (gad) {
    if (gad instanceof Gadget)
        return gad;
    else if (_.isNumber(gad))
        return this.findGadById(gad);
};

// [TODO]
Freebird.prototype._reload = function (nc, callback) {
    // [TODO] returned data format?
    var self = this,
        devInstances;   // [ { id, dev, gads: [] } ]

    callback = callback || function () {};

    return reloadObjects(this, 'dev', nc, function (err, reloadDevs) {
        devInstances = reloadDevs;

        if (err) {
            callback(err);
        } else {
            _.forEach(reloadDevs, function (reloDev) {
                if (reloDev.dev) {
                    reloadGadsFromDev(self, reloDev.dev, function (err, reloadGads) {
                        if (err)
                            reloDev.gads = null;
                        else
                            reloDev.gads = reloadGads;
                    });
                }
            });
        }
    });
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

// [TODO]
// registration
Freebird.prototype.registerNetcore = function (nc, callback) {
    var self = this,
        ncName;

    if (!(nc instanceof Netcore))
        callback(new Error('Not a netcore, cannot register to freebird.'));

    ncName = nc.getName();
    if (!this.getNetcore(ncName))
        this._netcores.push(nc);

    this._reload(nc, function () {
        // no matter error or not, we did reload
        self.net.start(ncName, callback);   // start netcore
    });

    return this;
};

// [TODO] ????
Freebird.prototype.unregisterNetcore = function (nc, callback) {
    var ncName ;

    if (_.isString(nc)) {
        ncName = nc;
        nc = this.getNetcore(ncName);
    } else if (nc instanceof Netcore) {
        ncName = nc.getName();
    } else {
        return callback(new Error('Netcore not found.'));
    }

    // disable netcore
    this.net.stop(ncName, function (err) {
        var allDevs = self._devbox.filter(function (dev) {
                return dev.getNetcore() === nc;
            }),
            allGads = self._gadbox.filter(function (gad) {
                return gad.getNetcore() === nc;
            });

        if (err) {
            callback(err);
        } else {

            allGads.forEach(function (gad) {
                gad.disable();
            });

            allDevs.forEach(function (dev) {
                dev.disable();
                self.net.remove(ncName, dev.getPermAddr());
            });


        }
    });
    // unregisterDev()
    // unregisterGad()
    // disable all gadgets
    // disable all devices
    // remove all gadgets
    // remove all devices
    gadIds = this._gadbox.filter('_netcore', nc).map(function (gad) {
        return gad.getId();
    });

    // remove netcore
};

Freebird.prototype.registerDev = function (dev, callback) {
    // dev can be number or device instance
    dev = this._devInstance(dev);
    callback = callback || function () {};

    if (!dev)
        return callback(new Error('dev not found.'));

    dev.setNetInfo({
        joinTime: Math.floor(Date.now()/1000)
    });

    this._devbox.add(dev, function (err, id) {
        if (!err)
            dev._setId(id);

        callback(err, id);
    });

    return this;
};

Freebird.prototype.unregisterDev = function (dev, callback) {
    var self = this,
        gads;

    dev = this._devInstance(dev);
    callback = callback || function () {};

    if (!dev)
        return callback(new Error('dev not found.'));

    this._devbox.remove(dev.getId(), function (err) {
        var numToRemove = 0;

        if (!err) {
            // unregister gadgets
            gads = dev.getGadTable();
            numToRemove = gads.length;

            gads.forEach(function (rec) {
                var gad = self.findGadById(rec.gadId);
                self.unregisterGad(gad, function (e) {
                    numToRemove -= 1;

                    if (numToRemove === 0) {
                        dev.disable();
                        dev._clear();
                        dev = null;
                        callback(null);
                    }
                });
            });
        }
        callback(err);
    });

    return this;
};

Freebird.prototype.registerGad = function (gad, callback) {
    var dev;
    callback = callback || function () {};

    gad = this._gadInstance(gad);

    if (!gad)
        return callback(new Error('gadget not found.'));

    dev = gad.getDev();
    this._gadbox.add(gad, function (err, id) {
        if (!err) {
            gad._setId(id);
            dev._setGadIdToAuxId(id, gad.getAuxId());
        }

        callback(err, id);
    });
};

Freebird.prototype.unregisterGad = function (gad, callback) {
    gad = this._gadInstance(gad);
    callback = callback || function () {};

    if (!gad)
        return callback(new Error('gadget not found.'));

    var dev = gad.getDev(),
        gadId = gad.getId(),
        auxId = gad.getAuxId();

    this._gadbox.remove(gadId, function (err) {
        if (!err) {
            dev._unlinkGad(gadId, auxId);
            gad.disable();
            gad._clear();
            gad = null;
        }

        callback(err);
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

    return blackList;
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

function reloadObjects(fb, type, owner, callback) {
    var self = fb,
        box,
        token,
        objId,
        instances = [];

    if (type === 'dev') {           // from netcore
        if (_.isString(owner)) {
            objId = owner;          // objId is ncName
            owner = self.getNetcore(objId);
        } else if (owner instanceof Netcore) {
            objId = owner.getName();
        } else {
            owner = null;
        }
        box = fb._devbox;
        token = { netcore: objId };
    } else if (type === 'gad') {    // from device
        if (_.isNumber(owner)) {
            objId = owner;          // objId is devId
            owner = self.findDevById(objId);
        } else if (owner instanceof Device) {
            objId = owner.getId();
        } else {
            owner = null;
        }
        box = fb._gadbox;
        token = { dev: { id: objId } };
    } else {
        return callback(new Error('Unknown reloading type.'));
    }

    if (!owner && type === 'dev')
        return callback(new Error('Invalid netcore or netcore name.'));

    box.findFromDb(token, function (err, recs) {
        if (err) {
            callback(err);
        } else if (!recs || !recs.length) { // find nothing
            callback(null, instances);
        } else {
            var finder = (type === 'dev') ? self.findDevById : self.findGadById;

            _.forEach(recs, function (rec) {
                var output = { id: null },
                    obj = finder(rec.id);

                output[type] = null;

                if (!obj) { // recover if obj is not in box
                    obj = (type === 'dev') ? new Device(owner) : new Gadget(owner, rec.auxId);  // raw and extra not set here, should attach when coming again
                    obj.recoverFromRecord(rec);
                    output.id = obj.getId();
                    output[type] = obj;
                    box.set(output.id, obj, function (err, id) {
                        if (err) {
                            obj = null;
                            output[type] = null;
                        }
                    });
                } else {
                    output.id = obj.getId();
                    output[type] = obj;
                }

                instances.push(output);
            });

            callback(null, instances);
        }
    });
}

function reloadGadsFromDev(fb, dev, callback) {
    return reloadObjects(fb, 'gad', dev, callback);
}

module.exports = Freebird;
