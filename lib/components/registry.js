var validate;
var _ = require('busyman');
var registry = {};

registry.method = function (regType, type) {
    if (type === 'nc')
        type = 'netcore';
    else if (type === 'dev')
        type = 'device';
    else if (type === 'gad')
        type = 'gadget';

    var methodName = regType + '_' + type;  // 'register_netcore'
    return registry[methodName];
};

registry.register_plugin = function (freebird, plugin, callback) {
    var err = null,
        plg = _.find(freebird._plugins, function (p) {
            return p === plugin;
        });

    if (!_.isFunction(plugin.receiveFreebirdEvent))
        err = new Error('plugin should have receiveFreebirdEvent() method.');
    else if (plg)
        err = new Error('plugin already exists.');

    if (!err)
        freebird._plugins.push(plugin);

    process.nextTick(function () {
        callback(err);
    });
};

// [TODO]
Freebird.prototype.unregister_plugin = function (plugin) {
    var plg = _.remove(this._plugins, function (p) {
            return p === plugin;
        });

    if (plg.length)
        unplugged = true;

    process.nextTick(function () {
        callback(err);
    });
};

registry.register_netcore = function (freebird, nc, callback) {
    validate.netcore(nc);
    var err = null,
        ncName = nc.getName();

    if (freebird.get('netcore', ncName))
        err = new Error('Netcore exists, cannot register to freebird. Unregister it first.');

    if (!err) {
        nc._freebird = freebird;
        freebird._netcores.push(nc);
    } else {
        nc = undefined;
    }

    process.nextTick(function () {
        callback(err, nc);
    });

    return freebird;
};

// [TODO]
Freebird.prototype.unregister_netcore = function (nc, callback) {
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

Freebird.prototype.register_device = function (dev, callback) {
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
        dev._poke();
        dev.setNetInfo({
            joinTime: Math.floor(Date.now()/1000)
        });

        this._devbox.add(dev, function (err, id) {
            if (!err) {
                dev._setId(id);     // set id to dev, registered successfully
            }
            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype.unregister_device = function (dev, callback) {
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

Freebird.prototype.register_gadget = function (gad, callback) {
    var self = this,
        gadId,
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
            if (!err) {
                gad._setId(id);     // also do dev._setGadIdToAuxId(id, auxId)
                var dev = gad.getDev(),
                    devId = dev.getId(),
                    gadTbl = dev.getGadTable();
                self._devbox.replace(devId, 'gads', gadTbl, function (errx) {
                    callback(errx, id);
                });

            } else {
                callback(null, id);
            }
        });
    }

    return this;
};

Freebird.prototype.unregister_gadget = function (gad, callback) {
    gad = this._gadInstance(gad);
    callback = callback || function (err) { console.log(err); };

    if (!gad) {
        callback(new Error('gadget is not found or not an instance of Gadget class.'));
    } else {
        this._gadbox.remove(gad.getId(), function (err) {
            if (!err) {
                // invoke _clear() before disable(), if not updateComponent() will try to modify a non-existent gad
                gad._clear();       // also do dev._unlinkGad(gadId, auxId)
                gad.disable();
                gad = null;
            }

            callback(err);
        });

    }
    return this;
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

module.exports = registry;