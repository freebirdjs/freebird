/* jshint node: true */
'use strict';

var _ = require('lodash'),
    fbbs = require('freebird-base'),
    Device = fbbs.Device,
    Gadget = fbbs.Gadget,
    Netcore = fbbs.Netcore;

var loader = {};

/***********************************************************************/
/*** Reload Methods                                                  ***/
/***********************************************************************/
loader.reloadSingleDev = function (fb, devRec, callback) {
    var ncName = devRec.netcore,
        nc = fb.getNetcore(ncName),
        dev = fb.findDevById(ncName, devRec.id),
        recoveredDev;

    callback = callback || function (err) { console.log(err); };

    if (!nc)    // netcore is not registered or dev exists, do not reload
        return callback(null, null);

    if (dev) {
        if (isSameDevice(dev, devRec))      // same dev exists, do not reload
            return callback(null, null);
        else                                // give new id to devRec
            devRec.id = null;
    }

    recoveredDev = new Device(nc);
    recoveredDev.recoverFromRecord(devRec);
    fb.registerDev(recoveredDev, callback); // return (err, id)
};

loader.reloadDevs = function (fb, callback) {
    var total = 0,
        recoveredIds = [];

    callback = callback || function (err) { console.log(err); };

    fb._devbox.findFromDb({}, function (err, devRecs) {    // find all devRecs

        if (err) {
            callback(err);
        } else {
            total = devRecs.length;

            if (total === 0) {
                callback(null, recoveredIds);
            } else {
                devRecs.forEach(function (devRec) {
                    loader.reloadSingleDev(fb, devRec, function (err, id) {
                        if (err)
                            recoveredIds.push(null);
                        else
                            recoveredIds.push(id);

                        total -= 1;
                        if (total === 0)    // all done
                            callback(null, recoveredIds);
                    });
                });
            }
        }
    });
};

loader.reloadSingleGad = function (fb, gadRec, callback) {
    var ncName = gadRec.netcore,
        permAddr = gadRec.dev.permAddr,
        hisDev = fb.findFromNetcore(ncName, 'device', permAddr),
        gad,
        recoveredGad;

    callback = callback || function (err) { console.log(err); };

    if (!hisDev)
        return callback(null, null);        // find no device, do not load

    gad = fb.findFromNetcore(ncName, 'gadget', permAddr, gadRec.auxId);

    if (gad)
        return callback(null, null);        // gad is there, do not load

    recoveredGad = new Gadget(hisDev, gadRec.auxId);
    recoveredGad.recoverFromRecord(gadRec);
    fb.registerGad(recoveredGad, callback);  // return (err, id)
};

loader.reloadGads = function (fb, callback) {
    var total = 0,
        recoveredIds = [];

    callback = callback || function (err) { console.log(err); };

    fb._gadbox.findFromDb({}, function (err, gadRecs) {
        if (err) {
            callback(err);
        } else {
            total = gadRecs.length;

            if (total === 0) {
                callback(null, recoveredIds);
            } else {
                gadRecs.forEach(function (gadRec) {
                    loader.reloadSingleGad(fb, gadRec, function (err, id) {
                        if (err)
                            recoveredIds.push(null);
                        else
                            recoveredIds.push(id);

                        total = total - 1;
                        if (total === 0)    // all done
                            callback(null, recoveredIds);
                    });
                });
            }
        }
    });
};

loader.reload = function (fb, callback) {
    var loadedDevIds,
        loadedGadIds;

    loader.reloadDevs(fb, function (err, devIds) {
        loadedDevIds = devIds;

        if (err) {
            loader.unloadDevs(loadedDevIds, function () {
                callback(err);
            });
        } else {
            loader.reloadGads(fb, function (err, gadIds) {
                loadedGadIds = gadIds;
                if (err) {
                    loader.unloadGads(fb, loadedGadIds);
                    loader.unloadDevs(fb, loadedDevIds);
                    callback(err);
                } else {
                    loader.sync(fb, function () {
                        callback(null);     // whether sync or not, return success
                    });
                }
            });
        }
    });
};

loader.sync = function (fb, callback) {
    loader._syncGads(fb, function (err) {
        if (err) {
            callback(err);
        } else {
            loader._syncDevs(fb, function (err) {
                callback(err);
            });
        }
    });
};

/***********************************************************************/
/*** Unload Methods                                                  ***/
/***********************************************************************/
loader.unloadDevs = function (fb, devIds, callback) {
    devIds.forEach(function (id) {
        if (id !== null && id !== undefined)
            fb._devbox.removeElement(id);
    });
    
    callback(null);
};

loader.unloadGads = function (fb, gadIds, callback) {
    gadIds.forEach(function (id) {
        if (id !== null && id !== undefined)
            fb._gadbox.removeElement(id);
    });
    
    callback(null);
};

/***********************************************************************/
/*** Private Methods                                                 ***/
/***********************************************************************/
loader._syncDevs = function (fb, callback) {
    var devIdsNotInBox = [],
        ops = 0;

    fb._devbox.findFromDb({}, function (err, devRecs) {
        ops = devRecs.length;

        if (err) {
            callback(err);
        } else {
            devRecs.forEach(function (d) {
                if (!fb.findDevById(d.id))
                    devIdsNotInBox.push(d.id);
            });

            if (devIdsNotInBox.length) {
                devIdsNotInBox.forEach(function (devId) {
                    process.nextTick(function () {
                        fb._devbox.remove(devId, function () {
                            ops -= 1;
                            if (ops === 0)
                                callback(null);
                        });
                    });
                });
            } else {
                callback(null);
            }
        }
    });
};

loader._syncGads = function (fb, callback) {
    var gadIdsNotInBox = [],
        ops = 0;

    fb._gadbox.findFromDb({}, function (err, gadRecs) {
        ops = gadRecs.length;

        if (err) {
            callback(err);
        } else {
            gadRecs.forEach(function (g) {
                if (!fb.findGadById(g.id))
                    gadIdsNotInBox.push(g.id);
            });

            if (gadIdsNotInBox.length) {
                gadIdsNotInBox.forEach(function (gadId) {
                    process.nextTick(function () {
                        fb._gadbox.remove(gadId, function () {
                            ops -= 1;
                            if (ops === 0)
                                callback(null);
                        });
                    });
                });
            } else {
                callback(null);
            }
        }
    });
};

function isSameDevice(dev, devRec) {
    var sameAddr,
        sameNc;

    sameAddr = (dev.getPermAddr() === devRec.net.address.permanent);

    if (!sameAddr)
        return false;

    sameNc = dev.getNetcore().getName() === devRec.netcore;

    if (!sameNc)
        return false;
    else
        return true;
}

module.exports = loader;
