'use strict';

var _ = require('busyman'),
    FBase = require('freebird-base'),
    validate = require('../utils/validate.js'),
    FB_STATE = require('../utils/constants.js').STATE;

var loader = {};

/***********************************************************************/
/*** Reload Methods                                                  ***/
/***********************************************************************/
loader.reloadSingleDev = function (freebird, devRec, callback) {
    var ncName = devRec.netcore,
        nc = freebird.findById('netcore', ncName),
        dev = freebird.findById('device', devRec.id),
        recoveredDev;

    if (!nc)                                    // netcore is not registered,  do not reload
        return setImmediate(callback);
    else if (dev && isSameDevice(dev, devRec))  // same dev exists, do not reload
        return setImmediate(callback);

    if (dev) {
        if (ncName === nc.getName() && devRec.net.address.permanent === dev.get('permAddr'))
            return; // already there, do not reload
    }

    recoveredDev = FBase.createDevice(nc);
    recoveredDev._recoverFromRecord(devRec);
    freebird.register('device', recoveredDev, callback);    // return (err, id)
};

loader.reloadSingleGad = function (freebird, gadRec, callback) {
    var ncName = gadRec.netcore,
        permAddr = gadRec.dev.permAddr,
        itsDev = freebird.findByNet('device', ncName, permAddr),
        gad = freebird.findByNet('gadget', ncName, permAddr, gadRec.auxId),
        recoveredGad;

    if (!itsDev || gad)
        return setImmediate(callback);          // find no device or gad is there, do not load

    recoveredGad = FBase.createGadget(itsDev, gadRec.auxId, gadRec);
    recoveredGad._recoverFromRecord(gadRec);
    freebird.register('gadget', recoveredGad, callback);    // return (err, id)
};

loader.reloadByType = function (freebird, type, callback) {
    var box,
        reloadSingle,
        total = 0,
        recoveredIds = [];

    if (type === 'device') {
        box = freebird._devbox;
        reloadSingle = loader.reloadSingleDev;
    } else if (type === 'gadget') {
        box = freebird._gadbox;
        reloadSingle = loader.reloadSingleGad;
    } else {
        return setImmediate(callback, new TypeError('Unknown type: ' + type + ' to reload from'));
    }

    box.findFromDb({}, function (err, recs) {
        if (err)
            return callback(err);
        else if (recs.length === 0)
            return callback(null, recoveredIds);

        total = recs.length;

        _.forEach(recs, function (rec) {
            reloadSingle(freebird, rec, function (err, id) {
                recoveredIds.push(err ? null : id);
                total = total - 1;
                if (total === 0)                // all done
                    callback(null, recoveredIds);
            });
        });
    });
};

loader.reload = function (freebird, callback) {
    var loadedDevIds,
        loadedGadIds;

    loader.reloadByType(freebird, 'device', function (err, devIds) {
        loadedDevIds = devIds;
        if (err)
            return loader.unloadDevs(loadedDevIds, function () {
                callback(err);
            });

        loader.reloadByType(freebird, 'gadget', function (err, gadIds) {
            loadedGadIds = gadIds;
            if (err) {
                loader.unloadGads(freebird, loadedGadIds, function () {
                    loader.unloadDevs(freebird, loadedDevIds, function () {
                        callback(err);
                    });
                });
            } else {
                loader.sync(freebird, function () {
                    callback(null);             // whether sync or not, return success
                });
            }
        });
    });
};

loader.sync = function (freebird, callback) {
    loader._syncByType(freebird, 'gadget', function (err) {
        if (err)
            callback(err);
        else
            loader._syncByType(freebird, 'device', callback);
    });
};

/***********************************************************************/
/*** Unload Methods                                                  ***/
/***********************************************************************/
loader.unloadDevs = function (freebird, devIds, callback) {
    if (freebird._getState() !== FB_STATE.RESETTING) {
        _.forEach(devIds, function (id) {
            if (!_.isNil(id))
                freebird._devbox.removeElement(id);
        });
        return setImmediate(callback);
    } else {
        var devId = devIds.pop(),
            removeCb = function (err) {
                if (err) 
                    return callback(err);
                else if (devIds.length === 0)
                    return callback(null);
                else
                    freebird._devbox.remove(devIds.pop(), removeCb);
            };

        freebird._devbox.remove(devId, removeCb);
    }
};

loader.unloadGads = function (freebird, gadIds, callback) {
    if (freebird._getState() !== FB_STATE.RESETTING) {
        _.forEach(gadIds, function (id) {
            if (!_.isNil(id))
                freebird._gadbox.removeElement(id);
        });
        return setImmediate(callback);
    } else {
        var gadId = gadIds.pop(),
            removeCb = function (err) {
                if (err) 
                    return callback(err);
                else if (gadIds.length === 0)
                    return callback(null);
                else
                    freebird._gadbox.remove(gadIds.pop(), removeCb);
            };

        freebird._gadbox.remove(gadId, removeCb);
    }
};

loader.unloadByNetcore = function (freebird, ncName, callback) {
    var nc = freebird.findByNet('netcore', ncName),
        loadedGadIds,
        loadedDevIds;

    if (!validate.callbackTypeError(callback) && !nc)
        return setImmediate(callback, new Error('netcore: ' + ncName + ' not found.'));

    loadedGadIds = freebird._gadbox.filter(function (gad) {
        return gad.get('netcore') === nc;
    }).map(function (gad) {
        return gad.get('id');
    });

    loadedDevIds = freebird._devbox.filter(function (dev) {
        return dev.get('netcore') === nc;
    }).map(function (dev) {
        return dev.get('id');
    });

    loader.unloadGads(freebird, loadedGadIds, function () {
        loader.unloadDevs(freebird, loadedDevIds, function (err) {
            callback(err);
        });
    });
};

/***********************************************************************/
/*** Private Methods                                                 ***/
/***********************************************************************/
loader._syncByType = function (freebird, type, callback) {
    var box,
        ops = 0,
        idsNotInBox = [];

    if (type === 'device')
        box = freebird._devbox;
    else if (type === 'gadget')
        box = freebird._gadbox;
    else
        return setImmediate(callback, new TypeError('Unknown type: ' + type + ' to sync with'));

    box.findFromDb({}, function (err, recs) {
        if (err)
            return callback(err);

        ops = recs.length;
        _.forEach(recs, function (rec) {
            if (!freebird.findById(type, rec.id))
                idsNotInBox.push(rec.id);
        });

        if (idsNotInBox.length) {
            _.forEach(idsNotInBox, function (id) {
                setImmediate(function () {
                    box.remove(id, function () {
                        ops = ops - 1;
                        if (ops === 0)
                            callback(null);
                    });
                });
            });
        } else {
            callback(null);
        }
    });
};

function isSameDevice(dev, devRec) {
    if (dev.get('permAddr') !== devRec.net.address.permanent)
        return false;
    else
        return (dev.get('netcore').getName() === devRec.netcore);
}

module.exports = loader;
