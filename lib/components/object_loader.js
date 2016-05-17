/* jshint node: true */
'use strict';

// [TODO] loader not complete

var fbbs = require('freebird-base'),
    Device = fbbs.Device,
    Gadget = fbbs.Gadget,
    Netcore = fbbs.Netcore;

var loader = {};

loader.reloadSingleDev = function (fb, ncName, devRec, callback) {
    var nc = fb.getNetcore(ncName),
        dev = fb.findDevById(ncName, devRec.id),
        recoveredDev;

    callback = callback || function (err) { console.log(err); };

    if (!nc) {
        callback(new Error('Invalid netcore.'));
    } else if (dev) { // already there
        callback(new Error('device exists.'));
    } else {
        recoveredDev = new Device(nc);
        recoveredDev.recoverFromRecord(devRec);
        fb.registerDev(recoveredDev, function (err, id) {
            if (err)
                callback(err);
            else
                callback(null, id);
        });
    }
};

loader.reloadDevs = function (fb, ncName, callback) {
    var total = 0,
        recoveredIds = [];

    callback = callback || function (err) { console.log(err); };

    fb._devbox.findFromDb({ netcore: ncName }, function (err, devRecs) {
        if (err) {
            callback(err);
        } else {
            total = devRecs.length;

            devRecs.forEach(function (devRec) {
                loader.reloadSingleDev(fb, ncName, devRec, function (err, id) {
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
    });
};

loader.reloadSingleGad = function (fb, ncName, gadRec, callback) {
    var hisDev = fb.findDevByAddr(ncName, gadRec.dev.permAddr),
        recoveredGad;

    callback = callback || function (err) { console.log(err); };

    if (!hisDev) {
        callback(new Error('Owner device is not found.'));
    } else {
        recoveredGad = new Gadget(hisDev, gadRec.auxId);
        recoveredGad.recoverFromRecord(gadRec);
        fb.registerGad(recoveredGad, function (err, id) {
            if (err)
                callback(err);
            else
                callback(null, id);
        });
    }
};

loader.reloadGads = function (fb, ncName, callback) {
    var total = 0,
        recoveredIds = [];

    callback = callback || function (err) { console.log(err); };

    fb._gadbox.findFromDb({ netcore: ncName }, function (err, gadRecs) {
        if (err) {
            callback(err);
        } else {
            total = gadRecs.length;

            gadRecs.forEach(function (gadRec) {
                loader.reloadSingleGad(fb, ncName, gadRec, function (err, id) {
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
    });
};

loader.reload = function (fb, ncName, callback) {
    loader.reloadDevs(fb, ncName, function (err, devIds) {
        if (err) {
            loader.unload(fb, ncName);
            callback(err);
        } else {
            loader.reloadGads(fb, ncName, function (err, gadIds) {
                if (err) {
                    loader.unload(fb, ncName);
                    callback(err);
                } else {
                    callback(null); // list format?
                }
            });
        }
    });
};

loader.unloadSingleDev = function (fb, ncName, devId, callback) {
    var nc = fb.getNetcore(ncName),
        dev = fb.findDevById(ncName, devId);

    if (dev)
        fb._devbox.removeElement(devId);
};

loader.unloadDevs = function (fb, ncName, callback) {
    var devs = fb._devbox.filter(function (dev) {
        return dev.getNetcore().getName() === ncName;
    });

    devs.forEach(function (dev) {
        if (dev)
            fb._devbox.removeElement(dev.getId());
    });
};

loader.unloadGads = function (fb, ncName, callback) {};
loader.unloadSingleGad = function (fb, ncName, gadRec, callback) {};

loader.unload = function (fb, ncName, callback) {
    loader.unloadDevs(fb, ncName);
    loader.unloadGads(fb, ncName);
};

    // unregisterDev()
    // unregisterGad()
    // disable all gadgets
    // disable all devices
    // remove all gadgets
    // remove all devices
