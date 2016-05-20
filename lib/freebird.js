/* jshint node: true */
'use strict';

var EventEmitter = require('events'),
    util = require('util');

var _ = require('lodash'),
    Objectbox = require('objectbox'),
    Fbws = require('freebird-websocket'),
    FreebirdBase = require('freebird-base'),
    Device = FreebirdBase.Device,
    Gadget = FreebirdBase.Gadget,
    Netcore = FreebirdBase.Netcore;

var wsApis = require('./apis/ws_apis'),
    drvApis = require('./apis/driver_apis'),
    loader = require('./components/object_loader'),
    ncListeners = require('./components/nc_event_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(httpServer, opt) {    // opt: { maxDevNum: x, maxGadNum: y }
    var maxDevNum,
        maxGadNum;

    opt = opt || {};
    maxDevNum = opt.maxDevNum || 6000;
    maxGadNum = opt.maxGadNum || (3 * maxDevNum);

    if (maxGadNum < maxDevNum)
        throw new Error('Max gadget number cannot be less than max device number.');

    if (!(this instanceof Freebird))
        return new Freebird(httpServer);

    EventEmitter.call(this);

    this._httpServer = httpServer || null;
    this._wsServer = null;

    this._plugins = [];
    this._netcores = [];
    this._devbox = new Objectbox(devboxPath, maxDevNum);
    this._gadbox = new Objectbox(gadboxPath, maxGadNum);

    this._wsApis = {};              // bind websocket net, dev, and gad methods by bindWsApis()
    this.net = {};                  // bind driver methods by bindDrivers()
    this.dev = {};
    this.gad = {};
    this._ncEventListeners = {};    // to manage all inner listeners

    wsApis.bindWsApis(this);
    drvApis.bindDrivers(this);
    ncListeners.attachEventListeners(this);

    // default authenticate all clients, override at will
    this.authenticate = function (wsClient, data, cb) {
        cb(null, true);
    };

    // default authorize all clients, override at will
    this.authorize = function (wsClient, cb) {
        cb(null, true);
    };
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
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

Freebird.prototype.findGadById = function (id) {
    return this._gadbox.get(id);
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
    var nc = this._ncInstance(ncName);
    return nc ? nc.getBlacklist() : undefined;
};

/***********************************************************************/
/*** Public Methods: Start and Stop                                  ***/
/***********************************************************************/
Freebird.prototype.start = function (callback) {
    var self = this;
    // init web service (websocket)
    if (this._httpServer) {
        this._wsServer = new Fbws(this);
        this._wsServer.start(this.httpServer);
    }

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            // [TODO] emit error
            callback(err);
        } else {
            // start all netcores
            // callback(null);
        }
    });


};

Freebird.prototype.stop = function () {
    // stop all netcores
};

/***********************************************************************/
/*** Public Methods: Registeration                                   ***/
/***********************************************************************/
Freebird.prototype.registerPlugin = function (plugin) {
    var plugged = false,
        plg = _.find(this._plugins, function (p) {
            return p === plugin;
        });

    if (!_.isFunction(plugin.receiveFreebirdEvent))
        throw new Error('plugin should have receiveFreebirdEvent() method.');

    if (!plg) {
        this._plugins.push(plugin);
        plugged = true;
    }

    return plugged;
};

Freebird.prototype.unregisterPlugin = function (plugin) {
    var unplugged = false,
        plg = _.remove(this._plugins, function (p) {
            return p === plugin;
        });

    if (plg.length)
        unplugged = true;

    return unplugged;
};

Freebird.prototype.registerNetcore = function (nc, callback) {
    var err,
        ncName;

    if (!(nc instanceof Netcore)) {
        err = new Error('Not a netcore, cannot register to freebird.');
    } else {
        ncName = nc.getName();
        if (this.getNetcore(ncName))
            err = new Error('Netcore exists, cannot register to freebird. Unregister it first.');
    }

    if (err) {
        callback(err);
    } else {
        nc._fb = this;
        this._netcores.push(nc);
        callback(null, nc);
    }

    return this;
};

// [TODO]
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
            if (!err) {
                loader.unload(self, ncName, function (err) {
                    // [TODO]
                });
            } else {
                callback(err);
            }
        });

        // remove netcore
        _.remove(this._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    }

    return this;
};

Freebird.prototype.registerDev = function (dev, callback) {
    var devId,
        oldDev;

    if (!(dev instanceof Device))
        throw new Error('dev should be an instance of Device class.');

    callback = callback || function (err) { console.log(err); };
    devId = dev.getId();

    if (!_.isNil(devId))
        oldDev = this.findDevById(dev.getId());

    if (oldDev) {
        callback(new Error('dev exists, unregister it first.'));
    } else if (dev._recovered) {
        this._devbox.set(devId, dev, function (err, id) {
            if (!err) {
                dev._recovered = false;
                delete dev._recovered;
            }
            callback(err, id);
        });
    } else {
        this._devbox.add(dev, function (err, id) {
            if (!err) {
                dev._setId(id);     // set id to dev, registered successfully
                dev.setNetInfo({
                    joinTime: Math.floor(Date.now()/1000)
                });
            }
            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype.unregisterDev = function (dev, callback) {
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
    var gadId,
        oldGad;

    if (!(gad instanceof Gadget))
        throw new Error('gad should be an instance of Gadget class.');

    callback = callback || function (err) { console.log(err); };
    gadId = gad.getId();

    if (!_.isNil(gadId))
        oldGad = this.findGadById(gadId);

    if (oldGad) {
        callback(new Error('gad exists, unregister it first.'));
    } else if (gad._recovered) {    // it was registered before, and now this instance is recovered from database
        this._gadbox.set(gadId, gad, function (err, id) {
            if (!err) {
                gad._recovered = false;
                delete gad._recovered;
            }
            callback(err, id);
        });
    } else {
        this._gadbox.add(gad, function (err, id) {
            if (!err)
                gad._setId(id);     // also do dev._setGadIdToAuxId(id, auxId)

            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype.unregisterGad = function (gad, callback) {
    gad = this._gadInstance(gad);
    callback = callback || function (err) { console.log(err); };

    if (!gad) {
        callback(new Error('gadget is not found or not an instance of Gadget class.'));
    } else {
        this._gadbox.remove(gad.getId(), function (err) {
            if (!err) {
                gad.disable();
                gad._clear();       // also do dev._unlinkGad(gadId, auxId)
                gad = null;
            }

            callback(err);
        });

    }
    return this;
};

Freebird.prototype.maintain = function (core, permAddr, auxId) {

};

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Freebird.prototype._emitws= function (evt, fbMsg, wsMsg) {
    // pass event to ws-server
    if (this._wsServer) {
        try {
            this._wsServer.receiveFreebirdEvent(evt, wsMsg);
        } catch (e) {
            console.log(e); // log: handler not found
        }
    }

    if (this._plugins.length) {
        _.forEach(this._plugins, function (plg) {
            process.nextTick(function () {
                plg.receiveFreebirdEvent(evt, fbMsg);
            });
        });
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

Freebird.prototype._getHttpServer = function () {
    return this._httpServer;
};

Freebird.prototype._getWsServer = function () {
    return this._wsServer;
};

module.exports = Freebird;
