'use strict';

var _ = require('busyman'),
    validate = require('../utils/validate.js');

var registry = {
    register: function (type, obj, callback) {
        if (type === 'device')
            return registerDevice(this, obj, callback);
        else if (type === 'gadget')
            return registerGadget(this, obj, callback);
        else
            setImmediate(callback, new TypeError('Unknown type: ' + type + ' to register with'));

        return this;
    },
    unregister: function (type, obj, callback) {
        if (type === 'device')
            return unregisterDevice(this, obj, callback);
        else if (type === 'gadget')
            return unregisterGadget(this, obj, callback);
        else
            setImmediate(callback, new TypeError('Unknown type: ' + type + ' to unregister with'));

        return this;
    }
};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
function registerDevice(freebird, dev, callback) {
    var devId, oldDev;

    if (!validate.isDevice(dev)) {
        setImmediate(callback, new TypeError('Input dev is not a valid device instance'));
        return freebird;
    }

    devId = dev.get('id');
    oldDev = _.isNil(devId) ? undefined : freebird.findById('device', devId);

    if (oldDev) {
        setImmediate(callback, new Error('Device with id: ' + devId + ' already exists, unregister it first'));
        return freebird;
    }

    if (dev._recovered) {   // recovered from database (when at booting up or restarting statge)
        freebird._devbox.set(devId, dev, function (err, id) {
            if (!err)
                dev._recovered = false;

            callback(err, id);
        });
    } else {
        dev._poke();
        dev.set('net', {
            joinTime: Math.floor(Date.now()/1000)   // seconds
        });

        freebird._devbox.add(dev, function (err, id) {
            if (!err)
                dev.set('_id', id);                 // set id to dev, registered successfully

            callback(err, id);
        });
    }

    return freebird;
};

function unregisterDevice(freebird, dev, callback) {
    if (!validate.isDevice(dev)) {
        setImmediate(callback, new TypeError('Input dev is not a valid device instance'));
        return freebird;
    }

    // unregister gadgets - 'gadLeaving' will be emitted@'devLeaving' handler. Let gadLeaving handler do the unregistration
    freebird._devbox.remove(dev.get('id'), callback);
    return freebird;
};

function registerGadget(freebird, gad, callback) {
    var gadId, oldGad;

    if (!validate.isGadget(gad)) {
        setImmediate(callback, new TypeError('Input gad is not a valid gadget instance'));
        return freebird;
    }

    gadId = gad.get('id');
    oldGad = _.isNil(gadId) ? undefined : freebird.findById('gadget', gadId);

    if (oldGad) {
        setImmediate(callback, new Error('Gadget with id: ' + gadId + ' already exists, unregister it first.'));
        return freebird;
    }

    if (gad._recovered) {   // it was registered before, and now this instance is recovered from database
        freebird._gadbox.set(gadId, gad, function (err, id) {
            if (!err)
                gad._recovered = false;

            callback(err, id);
        });
    } else {
        freebird._gadbox.add(gad, function (err, id) {
            if (!err) {
                gad.set('_id', id); // dev._connectGadIdToAuxId(id, auxId) will be called in gad.set('_id', id)

                var dev = gad.get('device'),
                    devId = dev.get('id'),
                    gadTbl = dev.get('gadTable');

                freebird._devbox.replace(devId, '_gads', gadTbl, function (er) {
                    callback(er, id);
                });
            } else {
                callback(err, id);
            }
        });
    }

    return freebird;
};

function unregisterGadget(freebird, gad, callback) {
    if (!validate.isGadget(gad)) {
        setImmediate(callback, new TypeError('Input gad is not a valid gadget instance'));
        return freebird;
    }

    freebird._gadbox.remove(gad.get('id'), function (err) {
        if (!err) {
            gad._clear();
            // if not invoking _clear() before disable(), updateComponent() will try to modify a non-existent gad
            // _clear() will also do dev._unlinkGad(gadId, auxId)
            gad.disable();
            gad = null;
        }
        callback(err);
    });

    return freebird;
};

module.exports = registry;
