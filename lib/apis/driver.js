// we don't need drivers
'use strict';

var _ = require('busyman'),
    utils = require('../utils/utils');

var netDriverNames = [ 'start', 'stop', 'enable', 'disable', 'reset', 'permitJoin', 'remove', 'ban', 'unban', 'ping', 'maintain' ],
    devDriverNames = [ 'read', 'write', 'identify', 'enable', 'disable' ],
    gadDriverNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable' ];

var drvApis = {};

/*************************************************************************************************/
/*** Driver Binder                                                                             ***/
/*************************************************************************************************/
drvApis.bindDrivers = function (freebird) {
    freebird.net = _.isObject(freebird.net) ? freebird.net : {};
    freebird.dev = _.isObject(freebird.dev) ? freebird.dev : {};
    freebird.gad = _.isObject(freebird.gad) ? freebird.gad : {};

    _.forEach(netDriverNames, function (name) {
        freebird.net[name] = drvApis[name].bind(freebird);
    });

    _.forEach(devDriverNames, function (name) {
        freebird.dev[name] = drvApis['dev' + _.upperFirst(name)].bind(freebird);
    });

    _.forEach(gadDriverNames, function (name) {
        freebird.gad[name] = drvApis['gad' + _.upperFirst(name)].bind(freebird);
    });
};

/*************************************************************************************************/
/*** Net Drivers                                                                               ***/
/*************************************************************************************************/
drvApis.enable = function (ncName, callback) {
    var nc = this.find('netcore', ncName);
    if (utils.hasCalledWithNotFoundError('netcore', nc, callback)) return;

    try {
        nc.enable();
        return utils.feedbackNextTick(null, nc.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.disable = function (ncName, callback) {
    var nc = this.find('netcore', ncName);
    if (utils.hasCalledWithNotFoundError('netcore', nc, callback)) return;

    try {
        nc.disable();
        return utils.feedbackNextTick(null, nc.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.start = function (ncName, callback) {
    var nc = this.find('netcore', ncName);
    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.start(callback);
};  // callback(err)

drvApis.stop = function (ncName, callback) {
    var nc = this.find('netcore', ncName);
    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.stop(callback);
};  // callback(err)

drvApis.reset = function (ncName, mode, callback) {
    var nc = this.find('netcore', ncName);
    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.reset(mode, callback);
};  // // callback(err)

drvApis.permitJoin = function (ncName, duration, callback) {
    var self = this,
        nc = this.find('netcore', ncName);

    callback = callback || function (err, timeLeft) {
        if (err)
            self.emit('_nc:error', err);
    };

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.permitJoin(duration, callback);
};  // callback(err, timeLeft)

drvApis.remove = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback) ||
        utils.hasCalledWithNotFoundError('device', dev, callback))
        return;

    dev._removing = true;   // devLeaving Helper
    nc.remove(permAddr, function (err, result) {
        if (err)
            dev._removing = false;
        callback(err, result);
    });
};  // callback(err, permAddr)

drvApis.ban = function (ncName, permAddr, callback) {
    var self = this,
        nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback)) return;
    // ban anyway whether dev is found or not
    nc.ban(permAddr, function (err, result) {
        if (dev) {
            self.unregister('device', dev, function (e) {
                callback(e, e ? undefined : permAddr);
            });
        } else {
            callback(null, permAddr);
        }
    });
};  // callback(err, permAddr)

drvApis.unban = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName);

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.unban(permAddr, callback);
};  // callback(err, permAddr)

drvApis.ping = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName);

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        nc.ping(permAddr, callback);
};  // callback(err, time)

drvApis.maintain = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        dev.refresh(callback);
};

/*************************************************************************************************/
/*** Device Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.devEnable = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback) ||
        utils.hasCalledWithNotFoundError('device', dev, callback))
        return;

    try {
        dev.enable();
        return utils.feedbackNextTick(null, dev.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.devDisable = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback) ||
        utils.hasCalledWithNotFoundError('device', dev, callback))
        return;

    try {
        dev.disable();
        return utils.feedbackNextTick(null, dev.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.devRead = function (ncName, permAddr, attr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        dev.read(attr, callback);
};  // callback(err, val)

drvApis.devWrite = function (ncName, permAddr, attr, val, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        dev.write(attr, val, callback);
};  // callback(err, val)

drvApis.devIdentify = function (ncName, permAddr, callback) {
    var nc = this.find('netcore', ncName),
        dev = nc ? this.findFromNetcore(ncName, permAddr) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        dev.identify(callback);
};  // callback(err)

/*************************************************************************************************/
/*** Gadget Drivers                                                                            ***/
/*************************************************************************************************/
drvApis.gadEnable = function (ncName, permAddr, auxId, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback) ||
        utils.hasCalledWithNotFoundError('gadget', gad, callback))
        return;

    try {
        gad.enable();
        return utils.feedbackNextTick(null, gad.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.gadDisable = function (ncName, permAddr, auxId, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (utils.hasCalledWithNotFoundError('netcore', nc, callback) ||
        utils.hasCalledWithNotFoundError('gadget', gad, callback))
        return;

    try {
        gad.disable();
        return utils.feedbackNextTick(null, gad.isEnabled(), callback);
    } catch (e) {
        return utils.feedbackNextTick(e, null, callback);
    }
};  // callback(err, isEnabled)

drvApis.gadRead = function (ncName, permAddr, auxId, attr, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gad.read(attr, callback);
};  // callback(err, val)

drvApis.gadWrite = function (ncName, permAddr, auxId, attr, val, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gad.write(attr, val, callback);
};  // callback(err, val)

drvApis.gadExec = function (ncName, permAddr, auxId, attr, args, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gad.exec(attr, args, callback);
};  // callback(err, result)

drvApis.gadSetReportCfg = function (ncName, permAddr, auxId, attrName, cfg, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gad.setReportCfg(attrName, cfg, callback);
};  // callback(err, result)

drvApis.gadGetReportCfg = function (ncName, permAddr, auxId, attrName, callback) {
    var nc = this.find('netcore', ncName),
        gad = nc ? this.findFromNetcore(ncName, permAddr, auxId) : undefined;

    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gad.getReportCfg(attrName, callback);
};  // callback(err, cfg)

module.exports = drvApis;
