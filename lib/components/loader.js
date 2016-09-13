'use strict';

var _ = require('busyman'),
    FreebirdBase = require('freebird-base'),
    utils = require('../utils/utils'),
    Device = FreebirdBase.Device,
    Gadget = FreebirdBase.Gadget;

var loader = {};

/***********************************************************************/
/*** Reload Methods                                                  ***/
/***********************************************************************/
loader.reloadSingleDev = function (freebird, devRec, callback) {
    var ncName = devRec.netcore,
        nc = freebird.find('netcore', ncName),
        dev = freebird.find('device', devRec.id),
        recoveredDev;

    if (!nc)    // netcore is not registered or dev exists, do not reload
        return utils.feedback(null, null, callback);

    if (dev && isSameDevice(dev, devRec))   // same dev exists, do not reload
        return utils.feedback(null, null, callback);
    else if (dev)
        devRec.id = null;                   // give new id to devRec

    recoveredDev = new Device(nc);
    recoveredDev.recoverFromRecord(devRec);
    freebird.register('device', recoveredDev, callback);        // return (err, id)
};

loader.reloadSingleGad = function (freebird, gadRec, callback) {
    var ncName = gadRec.netcore,
        permAddr = gadRec.dev.permAddr,
        hisDev = freebird.findFromNetcore(ncName, 'device', permAddr),
        gad = freebird.findFromNetcore(ncName, 'gadget', permAddr, gadRec.auxId),
        recoveredGad;

    if (!hisDev || gad)
        return utils.feedback(null, null, callback);            // find no device or gad is there,  do not load

    recoveredGad = new Gadget(hisDev, gadRec.auxId);
    recoveredGad.recoverFromRecord(gadRec);
    freebird.register('gadget', recoveredGad, callback);        // return (err, id)
};

loader.reloadByType = function (freebird, type, callback) {
    var box,
        reloadSingle,
        total = 0,
        recoveredIds = [];

    if (type === 'dev' || type === 'device') {
        box = freebird._devbox;
        reloadSingle = loader.reloadSingleDev;
    } else if (type === 'gad' || type === 'gadget') {
        box = freebird._gadbox;
        reloadSingle = loader.reloadSingleGad;
    } else {
        return utils.feedback(new Error('Unknown type: ' + type), null, callback);
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
                if (total === 0)    // all done
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
                    callback(null);     // whether sync or not, return success
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
    devIds.forEach(function (id) {
        if (id !== null && id !== undefined)
            freebird._devbox.removeElement(id);
    });
    return utils.feedback(null, null, callback);
};

loader.unloadGads = function (freebird, gadIds, callback) {
    gadIds.forEach(function (id) {
        if (id !== null && id !== undefined)
            freebird._gadbox.removeElement(id);
    });
    return utils.feedback(null, null, callback);
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
        return utils.feedback(new Error('Unknown type: ' + type), null, callback);

    box.findFromDb({}, function (err, recs) {
        if (err)
            return callback(err);

        ops = recs.length;
        _.forEach(recs, function (rec) {
            if (!freebird.find(type, rec.id))
                idsNotInBox.push(rec.id);
        });

        if (idsNotInBox.length) {
            _.forEach(idsNotInBox, function (id) {
                process.nextTick(function () {
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
