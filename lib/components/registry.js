'use strict';

var validate;
var _ = require('busyman'),
    utils = require('../utils/utils');
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
    // var err = null,
    //     plg = freebird.find('plugin', plugin);

    //     _.find(freebird._plugins, function (p) {
    //         return p === plugin;
    //     });

    // if (!_.isFunction(plugin.receiveFreebirdEvent))
    //     err = new Error('plugin should have receiveFreebirdEvent() method.');
    // else if (plg)
    //     err = new Error('plugin already exists.');

    // if (!err)
    //     freebird._plugins.push(plugin);

    // process.nextTick(function () {
    //     callback(err);
    // });
};

// [TODO]
registry.unregister_plugin = function (freebird, plugin, callback), {
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

    if (freebird.find('netcore', nc.getName())) {
        utils.feedback(new Error('Netcore exists, cannot register to freebird. Unregister it first.'), null, callback);
        return freebird;
    }

    nc._freebird = freebird;
    freebird._netcores.push(nc);
    utils.feedback(null, nc, callback);

    return freebird;
};

registry.unregister_netcore = function (freebird, nc, callback) {
    if (_.isObject(nc))
        validate.netcore(nc);

    var err,
        ncName = _.isString(nc) ? ncName : nc.getName();

    // disable netcore
    freebird.net.stop(ncName, function (err) {
        if (err)
            return callback(err);

        loader.unloadByNetcore(freebird, ncName, function (err) {
            // don't care err, remove anyway
            _.remove(freebird._netcores, function (nc) {
                return nc.getName() === ncName;
            });
        });
    });

    return freebird;
};

registry.register_device = function (freebird, dev, callback) {
    validate.device(dev);

    var devId = dev.get('id'),
        oldDev = _.isNil(devId) ? undefined : freebird.find('device', devId);

    if (oldDev)
        return utils.feedback(new Error('dev exists, unregister it first.'), null, callback);

    if (dev._recovered) {   // recovered from database (when at booting up or restarting statge)
        freebird._devbox.set(devId, dev, function (err, id) {
            if (!err) {
                dev._recovered = false;
                delete dev._recovered;
            }
            callback(err, id);
        });
    } else {
        dev._poke();
        dev.set('net', {
            joinTime: utils.nowSeconds()
        });

        freebird._devbox.add(dev, function (err, id) {
            if (!err)
                dev._setId(id); // set id to dev, registered successfully

            callback(err, id);
        });
    }

    return freebird;
};

registry.unregister_device = function (freebird, dev, callback) {
    dev = registry._devInstance(dev);
    validate.device(dev);

    freebird._devbox.remove(dev.get('id'), function (err) {
        // unregister gadgets - 'gadLeaving' will be emitted@'devLeaving' handler
        // let gadLeaving handler do the unregistration
        callback(err);
    });

    return freebird;
};

registry.register_gadget = function (freebird, gad, callback) {
    validate.gadget(gad);

    var gadId = gad.get('id'),
        oldGad = _.isNil(gadId) ? undefined : freebird.find('gadget', gadId);

    if (oldGad)
        return utils.feedback(new Error('gad exists, unregister it first.'), null, callback);

    if (gad._recovered) {   // it was registered before, and now this instance is recovered from database
        freebird._gadbox.set(gadId, gad, function (err, id) {
            if (!err) {
                gad._recovered = false;
                delete gad._recovered;
            }
            callback(err, id);
        });
    } else {
        freebird._gadbox.add(gad, function (err, id) {
            if (!err) {
                gad.set('_id', id);     // also do dev._connectGadIdToAuxId(id, auxId)
                var dev = gad.get('device'),
                    devId = dev.get('id'),
                    gadTbl = dev.get('gadTable');

                freebird._devbox.replace(devId, 'gads', gadTbl, function (errx) {
                    callback(errx, id);
                });
            } else {
                callback(err, id);
            }
        });
    }

    return freebird;
};

registry.unregister_gadget = function (freebird, gad, callback) {
    gad = registry._gadInstance(gad);
    validate.gadget(gad);

    freebird._gadbox.remove(gad.get('id'), function (err) {
        if (!err) {
            // invoke _clear() before disable(), if not updateComponent() will try to modify a non-existent gad
            gad._clear();       // also do dev._unlinkGad(gadId, auxId)
            gad.disable();
            gad = null;
        }
        callback(err);
    });

    return freebird;
};

//--------------------------------------------------------------------------
registry._ncInstance = function (freebird, nc) {
    var netcore;

    if (nc instanceof Netcore)
        netcore = nc;
    else if (_.isString(nc))
        netcore = this.getNetcore(nc);

    return netcore;
};

registry._devInstance = function (freebird, dev) {
    var device;

    if (dev instanceof Device)
        device = dev;
    else if (_.isNumber(dev))
        device = this.findDevById(dev);

    return device;
};

registry._gadInstance = function (freebird, gad) {
    var gadget;

    if (gad instanceof Gadget)
        gadget = gad;
    else if (_.isNumber(gad))
        gadget = this.findGadById(gad);

    return gadget;
};

registry._getHttpServer = function (freebird) {
    return this._httpServer;
};

module.exports = registry;