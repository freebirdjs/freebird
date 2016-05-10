var loader = {};

loader.reload = function (fb, ncName, callback) {
    loader.reloadDevs(fb, ncName, function (err, devIds) {
        if (err) {
            callback(err);
            // loader.unloadDevs(fb, ncName);
        } else {
            loader.reloadGads(fb, ncName, function (err, gadIds) {
                if (err) {
                    // loader.unloadDevs(fb, ncName);
                    // loader.unloadGads(fb, ncName);
                }
            });
        }
    });
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

                    total = total - 1;
                    if (total === 0)    // all done
                        callback(null, recoveredIds);
                });
            });
        }
    });
};

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
        fb.registerDev(recoveredDev, callback);
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

loader.reloadSingleGad = function (fb, ncName, gadRec, callback) {
    var hisDev = fb.findDevByAddr(ncName, gadRec.dev.permAddr),
        recoveredGad;

    callback = callback || function (err) { console.log(err); };

    if (!hisDev) {
        callback(new Error('Owner device is not found.'));
    } else {
        recoveredGad = new Gadget(hisDev, gadRec.auxId);
        recoveredGad.recoverFromRecord(gadRec);
        fb.registerGad(recoveredGad, callback);
    }
};

loader.unload = function (fb, ncName, callback) {};
loader.unloadDevs = function (fb, ncName, callback) {};
loader.unloadSingleDev = function (fb, ncName, devRec, callback) {};
loader.unloadGads = function (fb, ncName, callback) {};
loader.unloadSingleGad = function (fb, ncName, gadRec, callback) {};
    // unregisterDev()
    // unregisterGad()
    // disable all gadgets
    // disable all devices
    // remove all gadgets
    // remove all devices


Freebird.prototype._reload = function (nc, callback) {
    // [TODO] returned data format?
    var self = this,
        devInstances;   // [ { id, dev, gads: [] } ]

    callback = callback || function (err) { console.log(err); };

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

