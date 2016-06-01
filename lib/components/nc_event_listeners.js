/* jshint node: true */
'use strict';
var _ = require('lodash');

var EVT = require('./constants.js').UPSTREAM_EVENTS,
    fbbs = require('freebird-base'),
    Device = fbbs.Device,
    Gadget = fbbs.Gadget;

var listeners = {};

listeners.attachEventListeners = function (fb) {
    var ncLsns = fb._ncEventListeners;

    _.forEach(listeners, function (lsn, key) {
        if (key !== 'attachEventListeners')
            ncLsns[key] = lsn.bind(fb);
    });

    fb.on('_nc:ready', ncLsns.ncReady);                             // {}

    fb.on('_nc:error', ncLsns.ncError);                             // { error: err }
    fb.on('_nc:permitJoin', ncLsns.ncPermitJoin);                   // { timeLeft: self._joinTicks }
    fb.on('_nc:started', ncLsns.ncStarted);
    fb.on('_nc:stopped', ncLsns.ncStopped);
    fb.on('_nc:enabled', ncLsns.ncEnabled);
    fb.on('_nc:disabled', ncLsns.ncDisabled);
    fb.on('_nc:devNetChanging', ncLsns.ncDevNetChanging);           // { permAddr: permAddr, data: changes }
    fb.on('_nc:devIncoming', ncLsns.ncDevIncoming);                 // { permAddr: permAddr, raw: rawDev }
    fb.on('_nc:bannedDevIncoming', ncLsns.ncBannedDevIncoming);     // { permAddr: permAddr, raw: rawDev }
    fb.on('_nc:devLeaving', ncLsns.ncDevLeaving);                   // { permAddr: permAddr }
    fb.on('_nc:gadIncoming', ncLsns.ncGadIncoming);                 // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    fb.on('_nc:gadLeaving', ncLsns.ncGadLeaving);                   // { gad: gad }, internal event, not pass from low-level
    fb.on('_nc:bannedGadIncoming', ncLsns.ncBannedGadIncoming);     // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    fb.on('_nc:devReporting', ncLsns.ncDevReporting);               // { permAddr: permAddr, data: devAttrs }
    fb.on('_nc:bannedDevReporting', ncLsns.ncBannedDevReporting);   // { permAddr: permAddr, data: devAttrs }
    fb.on('_nc:gadReporting', ncLsns.ncGadReporting);               // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    fb.on('_nc:bannedGadReporting', ncLsns.ncBannedGadReporting);   // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }

    fb.on('_dev:error', ncLsns.devError);                           // { error: err }
    fb.on('_dev:netChanged', ncLsns.devNetChanged);                 // { data: delta }, setNetInfo
    fb.on('_dev:propsChanged', ncLsns.devPropsChanged);             // { data: delta }, setProps
    fb.on('_dev:attrsChanged', ncLsns.devAttrsChanged);             // { data: delta }, setAttrs

    // fb.on('_gad:error');                                         // { error: err }
    fb.on('_gad:panelChanged', ncLsns.gadPanelChanged);             // { data: delta }, setPanelInfo
    fb.on('_gad:propsChanged', ncLsns.gadPropsChanged);             // { data: delta }, setProps
    fb.on('_gad:attrsChanged', ncLsns.gadAttrsChanged);             // { data: delta }, setAttrs
};

/***********************************************************************/
/*** Netcore Event Listeners                                         ***/
/***********************************************************************/
// all 'this' in the fuctions will be bound to freebird
listeners.ncError = function (err) {        // err, err.info = { netcore: ncName }
    this._emitws(EVT.ERROR, err, err);
};

listeners.ncPermitJoin = function (msg) {   // { netcore: nc, timeLeft: ticks }
    var nc = msg.netcore,
        ncName = nc.getName(),
        wsMsg = { netcore: ncName, timeLeft: msg.timeLeft };

    this._emitws(EVT.PERMIT_JOIN, msg, wsMsg);
};

listeners.ncStarted = function (msg) {      // { netcore: nc }
    var nc = msg.netcore,
        ncName = nc.getName(),
        wsMsg = { netcore: ncName };

    this._emitws(EVT.STARTED, msg, wsMsg);
};

listeners.ncStopped = function (msg) {      // { netcore: nc }
    var nc = msg.netcore,
        ncName = nc.getName(),
        wsMsg = { netcore: ncName };

    this._emitws(EVT.STOPPED, msg, wsMsg);
};

listeners.ncEnabled = function (msg) {      // { netcore: nc }
    var nc = msg.netcore,
        ncName = nc.getName(),
        wsMsg = { netcore: ncName };

    this._emitws(EVT.ENABLED, msg, wsMsg);
};

listeners.ncDisabled = function (msg) {     // { netcore: nc }
    var nc = msg.netcore,
        ncName = nc.getName(),
        wsMsg = { netcore: ncName };

    this._emitws(EVT.DISABLED, msg, wsMsg);
};

/***********************************************************************/
/*** tackle device and gadget incoming, leaving, and reporting       ***/
/***********************************************************************/
listeners.ncReady = function (msg) { // { netcore: nc }
    var fb = this,
        ncName = msg.netcore.getName(),
        fbMsg = {},
        wsMsg = { netcore: ncName };

    fb._emitws(EVT.NET_READY, fbMsg, wsMsg);
};

listeners.ncDevNetChanging = function (msg) {  // { netcore: nc, permAddr: permAddr, data: changes }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr);

    if (dev)
        dev.setNetInfo(msg.data);

};

listeners.ncDevIncoming = function (msg) {      // { netcore: nc, permAddr: permAddr, raw: rawDev }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr),
        devIn = new Device(nc, msg.raw),
        fbMsg = { dev: null },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (typeof nc.cookRawDev !== 'function')
        return; // no cooker, do nothing

    nc.cookRawDev(devIn, msg.raw, function (err, ripeDev) {
        devIn = ripeDev;
        devIn.setNetInfo({ status: 'online' });

        if (dev) {
            console.log('EXISTS: registerDev!!!!!!');

            dev._poke();
            dev._setRawDev(devIn.getRawDev());  // should call _setRawDev() to reset raw (safe for recoverd device)
            dev.setNetInfo(devIn.getNetInfo()); // setNetInfo() will find out network changes and report
            dev.setAttrs(devIn.getAttrs());     // setAttrs() will find out attribute changes and report
            dev.extra = devIn.extra;            // should assign extra (safe for recoverd device)
            dev.setNetInfo({ status: 'online' });
        } else if (nc.isJoinable()) {
            console.log('NON-EXISTS: registerDev!!!!!!');
            fb.registerDev(devIn, function (err, id) {  // joinTime tagged in fb.registerDev()
                if (err) {
                    devIn = null;
                    fb._emitws(EVT.ERROR, err, err); // register fail
                } else {
                    devIn.enable();
                    devIn._poke();
                    fbMsg.dev = devIn;
                    wsMsg.id = devIn.getId();
                    wsMsg.data = devIn._dumpDevInfo();
                    fb._emitws(EVT.DEV_INCOMING, fbMsg, wsMsg);
                }
            });
        }
    });
};

listeners.ncDevLeaving = function (msg) {   // { netcore: nc, permAddr: permAddr }

    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr),
        fbMsg = { id: null },
        wsMsg = { netcore: ncName, id: null };

    if (!dev)
        return; // dev not found, do nothing

    dev._poke();
    fbMsg.id = wsMsg.id = dev.getId();
    dev.setNetInfo({ status: 'offline' });          // 'netChanged', 'statusChanged'

    if (dev._removing) {                            // manually remove, should unregister all things
        dev.getGadTable().forEach(function (rec) {
            var gad = fb.findGadById(rec.gadId);
            if (gad)
                gad._fbEmit('_nc:gadLeaving', { gad: gad });
        });

        fb.unregisterDev(dev, function (err) {
            if (err)
                fb._emitws(EVT.ERROR, err, err);
            else
                fb._emitws(EVT.DEV_LEAVING, fbMsg, wsMsg);
        });
    }
};

listeners.ncGadIncoming = function (msg) {  // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr),
        gad = fb.findGadByAddrAuxId(ncName, msg.permAddr, msg.auxId),
        gadIn,
        fbMsg = { gad: null },
        wsMsg = { netcore: ncName, id: null, data: null},
        doGadCook,
        syncTimes = 0;

    if (!dev)
        return; // device not found, ignore this gad incoming

    dev._poke();
    gadIn = new Gadget(dev, msg.auxId, msg.raw);
    dev.setNetInfo({ status: 'online' });

    if (typeof nc.cookRawGad !== 'function')
        return; // no cooker, do nothing

    doGadCook = function () {
        // This is used to sync gadIncoming
        if (dev.getId() === null) {
            syncTimes += 1;

            if (syncTimes > 500) // resync after 1 second, discard this gadIncoming message
                return;

            setTimeout(function () {
                doGadCook();
            }, 2);
            return;
        }

        nc.cookRawGad(gadIn, msg.raw, function (err, newGad) {
            gadIn = newGad;
            if (gad) {
                gad._setRawGad(gadIn.getRawGad());
                gad.setPanelInfo(gadIn.getPanelInfo()); // 'panelChanged'
                gad.setAttrs(gadIn.getAttrs());         // 'attrsChanged'
                gad.extra = gadIn.extra;
            } else if (nc.isJoinable()) {
                fb.registerGad(gadIn, function (err, id) {
                    if (!err) {
                        gadIn.enable();
                        fbMsg.gad = gadIn;
                        wsMsg.id = gadIn.getId();
                        wsMsg.data = gadIn._dumpGadInfo();
                        fb._emitws(EVT.GAD_INCOMING, fbMsg, wsMsg);
                    }
                });
            }
        });
    };

    doGadCook();
};

// internal event: from ncDevLeaving()
listeners.ncGadLeaving = function (msg) {   // { gad: gad }
    var fb = this,
        ncName = msg.netcore.getName(),
        gadId = msg.gad.getId(),
        fbMsg = { id: gadId },
        wsMsg = { netcore: ncName, id: gadId };

    fb.unregisterGad(msg.gad, function (err) {
        if (err)
            fb._emitws(EVT.ERROR, err, err); // if fails, gad won't be removed
        else
            fb._emitws(EVT.GAD_LEAVING, fbMsg, wsMsg);
    });
};

listeners.ncDevReporting = function (msg) { // { netcore: nc, permAddr: permAddr, data: devAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr),
        fbMsg = { dev: null, data: msg.data },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (!dev)
        return;

    fbMsg.dev = dev;
    wsMsg.id = dev.getId();
    dev._poke();
    dev.setAttrs(msg.data);     // 'attrsChanged'
    dev.setNetInfo({ status: 'online' });
    fb._emitws(EVT.DEV_REPORTING, fbMsg, wsMsg);
};

listeners.ncGadReporting = function (msg) { // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findDevByAddr(ncName, msg.permAddr),
        gad = fb.findGadByAddrAuxId(ncName, msg.permAddr, msg.auxId),
        fbMsg = { gad: null, data: msg.data },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (dev) {
        dev._poke();
        dev.setNetInfo({ status: 'online' });
    }

    if (!gad)
        return;

    fbMsg.gad = gad;
    wsMsg.id = gad.getId();
    gad.setAttrs(msg.data);     // 'attrsChanged'
    fb._emitws(EVT.GAD_REPORTING, fbMsg, wsMsg);
};

/***********************************************************************/
/*** tackle banned device and gadget events                          ***/
/***********************************************************************/
listeners.ncBannedDevIncoming = function (msg) {
    return bannedComponent(this, 'dev', 'bannedIncoming', msg);
};

listeners.ncBannedDevReporting = function (msg) {
    return bannedComponent(this, 'dev', 'bannedReport', msg);
};

listeners.ncBannedGadIncoming = function (msg) {
    return bannedComponent(this, 'gad', 'bannedIncoming', msg);
};

listeners.ncBannedGadReporting = function (msg) {
    return bannedComponent(this, 'gad', 'bannedReport', msg);
};

/***********************************************************************/
/*** device and gadget events: instance has been changed             ***/
/***********************************************************************/
listeners.devError = function (msg) {       // { error: err }: err, err.info = { netcore: ncName, dev: id }
    // console.log('#########################');
    // console.log(msg);
    this._emitws(EVT.ERROR, msg, msg);
};

listeners.devNetChanged = function (msg) {
    return updateComponent(this, 'dev', 'net', msg);
};

listeners.devPropsChanged = function (msg) {
    return updateComponent(this, 'dev', 'props', msg);
};

listeners.devAttrsChanged = function (msg) {
    return updateComponent(this, 'dev', 'attrs', msg);
};

listeners.gadPanelChanged = function (msg) {
    return updateComponent(this, 'gad', 'panel', msg);
};

listeners.gadPropsChanged = function (msg) {
    return updateComponent(this, 'gad', 'props', msg);
};

listeners.gadAttrsChanged = function (msg) {
    return updateComponent(this, 'gad', 'attrs', msg);
};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
function bannedComponent(fb, type, indType, msg, cb) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
    // { netcore: nc, permAddr, auxId: auxId, data: gadAttrs }
    var ncName = msg.netcore.getName(),
        permAddr = msg.permAddr,
        fbMsg = { netcore: ncName, permAddr: permAddr },    // +data
        evtName = getBanndedEventName(type, indType),
        component;

    if (type === 'dev') {
        component = fb.findDevByAddr(ncName, permAddr);
        fbMsg.raw = msg.raw;
        if (component) {
            fb.net.remove(ncName, permAddr, function (err) {
                if (err)
                    console.log(err);   // log
            });
        }
    } else if (type === 'gad') {
        component = fb.findGadByAddrAuxId(ncName, permAddr, msg.auxId);
        fbMsg.auxId = msg.auxId;
        fbMsg.data = msg.data;
        if (component)
            component._fbEmit('_nc:gadLeaving', { gad: component });
    }

    fb._emitws(evtName, fbMsg, fbMsg);

    if (cb)
        cb();
}

function getBanndedEventName(type, indType) {
    var evt;

    if (type === 'dev') {
        if (indType === 'bannedReport')
            evt = EVT.DEV_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = EVT.DEV_BAN_INCOMING;
    } else if (type === 'gad') {
        if (indType === 'bannedReport')
            evt = EVT.GAD_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = EVT.GAD_BAN_INCOMING;
    }
    return evt;
}

function updateComponent(fb, type, namespace, msg, cb) {
    // type = 'dev', msg: { netcore: nc, dev: dev, data: delta }
    // type = 'gad' ,msg: { netcore: nc, gad: gad, data: delta }
    var ncName = msg.netcore.getName(),
        id,
        delta = msg.data,
        fbMsg = { data: delta },                     // + dev or gad
        wsMsg = { netcore: ncName, data: delta },    // + id: devId or gadId,
        evtName = getUpdateEventName(type, namespace),
        box;

    if (type === 'dev') {
        fbMsg.dev = msg.dev;
        id = wsMsg.id = msg.dev.getId();
        box = fb._devbox;
    } else if (type === 'gad') {
        msg.gad.getDev();
        fbMsg.gad = msg.gad;
        id = wsMsg.id = msg.gad.getId();
        box = fb._gadbox;
    }

    box.modify(id, namespace, delta, function (err, diff) {
        if (err) {
            fb._emitws(EVT.ERROR, err, err);
        }

        fb._emitws(evtName, fbMsg, wsMsg);      // instance always been changed

        if (evtName === EVT.NET_CHANGED && delta.status) {
             fb._emitws(EVT.STATUS_CHANGED, {
                    dev: fbMsg.dev,
                    data: { status: delta.status }
                },
                {
                    netcore: ncName, id: wsMsg.id, data: { status: delta.status }
                }
            );
        }

        if (cb)
            cb(err, diff);
    });
}

function getUpdateEventName(type, namespace) {
    var evtName;

    if (type === 'dev') {
        if (namespace === 'net')
            evtName = EVT.NET_CHANGED;
        else if (namespace === 'props')
            evtName = EVT.DEV_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = EVT.DEV_ATTRS_CHANGED;
    } else if (type === 'gad') {
        if (namespace === 'panel')
            evtName = EVT.PANEL_CHANGED;
        else if (namespace === 'props')
            evtName = EVT.GAD_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = EVT.GAD_ATTRS_CHANGED;
    }

    return evtName;
}

module.exports = listeners;
