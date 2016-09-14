'use strict';

var _ = require('busyman'),
    utils = require('../utils/utils');

var FreebirdBase = require('freebird-base'),
    Device = FreebirdBase.Device,
    Gadget = FreebirdBase.Gadget,
    LLEVT = FreebirdBase.EVENTS,    // EVENTS from Low-Layer
    UPEVT = require('./constants.js').UPSTREAM_EVENTS;

var listeners = {};

listeners.attachEventListeners = function (freebird) {
    var ncLsns = freebird._ncEventListeners;

    // Firstly bind the handlers to freebird
    _.forEach(listeners, function (lsn, key) {
        if (key !== 'attachEventListeners')
            ncLsns[key] = lsn.bind(freebird);
    });

    // Then, attach the handlers to events
    freebird.on(LLEVT.NETCORE.ready, ncLsns.ncReady);                           // {}

    freebird.on(LLEVT.NETCORE.error, ncLsns.ncError);                           // { error: err }
    freebird.on(LLEVT.NETCORE.permitJoin, ncLsns.ncPermitJoin);                 // { timeLeft: self._joinTicks }
    freebird.on(LLEVT.NETCORE.started, ncLsns.ncStarted);
    freebird.on(LLEVT.NETCORE.stopped, ncLsns.ncStopped);
    freebird.on(LLEVT.NETCORE.enabled, ncLsns.ncEnabled);
    freebird.on(LLEVT.NETCORE.disabled, ncLsns.ncDisabled);
    freebird.on(LLEVT.NETCORE.devNetChanging, ncLsns.ncDevNetChanging);         // { permAddr: permAddr, data: changes }
    freebird.on(LLEVT.NETCORE.devIncoming, ncLsns.ncDevIncoming);               // { permAddr: permAddr, raw: rawDev }
    freebird.on(LLEVT.NETCORE.bannedDevIncoming, ncLsns.ncBannedDevIncoming);   // { permAddr: permAddr, raw: rawDev }
    freebird.on(LLEVT.NETCORE.devLeaving, ncLsns.ncDevLeaving);                 // { permAddr: permAddr }
    freebird.on(LLEVT.NETCORE.gadIncoming, ncLsns.ncGadIncoming);               // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    freebird.on(LLEVT.NETCORE.gadLeaving, ncLsns.ncGadLeaving);                 // { gad: gad }, internal event, not pass from low-level
    freebird.on(LLEVT.NETCORE.bannedGadIncoming, ncLsns.ncBannedGadIncoming);   // { permAddr: permAddr, auxId: auxId, raw: rawGad }
    freebird.on(LLEVT.NETCORE.devReporting, ncLsns.ncDevReporting);             // { permAddr: permAddr, data: devAttrs }
    freebird.on(LLEVT.NETCORE.bannedDevReporting, ncLsns.ncBannedDevReporting); // { permAddr: permAddr, data: devAttrs }
    freebird.on(LLEVT.NETCORE.gadReporting, ncLsns.ncGadReporting);             // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    freebird.on(LLEVT.NETCORE.bannedGadReporting, ncLsns.ncBannedGadReporting); // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }

    freebird.on(LLEVT.DEV.error, ncLsns.devError);                              // { error: err }
    freebird.on(LLEVT.DEV.netChanged, ncLsns.devNetChanged);                    // { data: delta }, setNetInfo
    freebird.on(LLEVT.DEV.propsChanged, ncLsns.devPropsChanged);                // { data: delta }, setProps
    freebird.on(LLEVT.DEV.attrsChanged, ncLsns.devAttrsChanged);                // { data: delta }, setAttrs

    // freebird.on('_gad:error');                                               // { error: err }
    freebird.on(LLEVT.GAD.panelChanged, ncLsns.gadPanelChanged);                // { data: delta }, setPanelInfo
    freebird.on(LLEVT.GAD.propsChanged, ncLsns.gadPropsChanged);                // { data: delta }, setProps
    freebird.on(LLEVT.GAD.attrsChanged, ncLsns.gadAttrsChanged);                // { data: delta }, setAttrs
    freebird.on(LLEVT.GAD.attrsAppend, ncLsns.gadAttrsAppend);                  // { data: attrs }, _dangerouslySetAttrs
};

/***********************************************************************/
/*** Netcore Event Listeners                                         ***/
/***********************************************************************/
// all 'this' in the fuctions will be bound to freebird
listeners.ncError = function (err) {        // err, err.info = { netcore: ncName }
    this._fireup(UPEVT.ERROR, err, err);
};

listeners.ncPermitJoin = function (msg) {   // { netcore: nc, timeLeft: ticks }
    var wsMsg = { netcore: msg.netcore.getName(), timeLeft: msg.timeLeft };
    this._fireup(UPEVT.PERMIT_JOIN, msg, wsMsg);
};

listeners.ncStarted = function (msg) {      // { netcore: nc }
    var wsMsg = { netcore: msg.netcore.getName() };
    this._fireup(UPEVT.STARTED, msg, wsMsg);
};

listeners.ncStopped = function (msg) {      // { netcore: nc }
    var wsMsg = { netcore: msg.netcore.getName() };
    this._fireup(UPEVT.STOPPED, msg, wsMsg);
};

listeners.ncEnabled = function (msg) {      // { netcore: nc }
    var wsMsg = { netcore: msg.netcore.getName() };
    this._fireup(UPEVT.ENABLED, msg, wsMsg);
};

listeners.ncDisabled = function (msg) {     // { netcore: nc }
    var wsMsg = { netcore: msg.netcore.getName() };
    this._fireup(UPEVT.DISABLED, msg, wsMsg);
};

/***********************************************************************/
/*** tackle device and gadget incoming, leaving, and reporting       ***/
/***********************************************************************/
listeners.ncReady = function (msg) { // { netcore: nc }
    var fbMsg = {},
        wsMsg = { netcore: msg.netcore.getName() };
    this._fireup(UPEVT.NET_READY, fbMsg, wsMsg);
};

listeners.ncDevNetChanging = function (msg) {  // { netcore: nc, permAddr: permAddr, data: changes }
    var ncName = msg.netcore.getName(),
        dev = this.findFromNetcore(ncName, 'device', msg.permAddr);

    if (dev)
        dev.set('net', msg.data);   // device will check changes and then fire event: LLENT.DEV.netChanged
};

listeners.ncDevIncoming = function (msg) {      // { netcore: nc, permAddr: permAddr, raw: rawDev }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findFromNetcore(ncName, 'device', msg.permAddr),
        devIn = new Device(nc, msg.raw),
        fbMsg = { dev: null },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (!_.isFunction(nc.cookRawDev)) {
        var noCookerError = new Error('Raw device cooker, cookRawDev(), is not implemeneted on netcore: ' + ncName);
        fb._fireup(UPEVT.ERROR, noCookerError, noCookerError);
        return; // no cooker, do nothing
    }

    nc.cookRawDev(devIn, msg.raw, function (err, ripeDev) {
        devIn = ripeDev;
        devIn.set('net', { status: 'online' });

        if (dev) {  // dev already exists, no need to fire UPEVT.DEV_INCOMING
            dev._poke();
            dev.set('_raw', devIn.get('raw'));      // should call set('_raw', raw) to reset raw (safe for recoverd device)
            dev.set('net', devIn.get('net'));       // set('net', info) will find out network changes and report
            dev.set('attrs', devIn.get('attrs'));   // set('attrs', attrs) will find out attribute changes and report
            dev.extra = devIn.extra;                // should assign extra (safe for recoverd device)
            dev.set('net', { status: 'online' });
        } else if (nc.isJoinable()) {
            fb.register('device', devIn, function (err, id) {   // joinTime tagged in fb.register('device')
                if (err) {
                    devIn = null;
                    fb._fireup(UPEVT.ERROR, err, err);          // register fail
                } else {
                    devIn.enable();
                    devIn._poke();
                    fbMsg.dev = devIn;
                    wsMsg.id = devIn.get('id');
                    wsMsg.data = utils.dumpDevInfo(devIn);
                    fb._fireup(UPEVT.DEV_INCOMING, fbMsg, wsMsg);
                }
            });
        }
    });
};

listeners.ncDevLeaving = function (msg) {   // { netcore: nc, permAddr: permAddr }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findFromNetcore(ncName, 'device', msg.permAddr),
        fbMsg = { id: null },
        wsMsg = { netcore: ncName, id: null };

    if (!dev)
        return; // dev not found, do nothing

    dev._poke();
    fbMsg.id = wsMsg.id = dev.get('id');
    dev.set('net', { status: 'offline' });          // 'netChanged', 'statusChanged'

    if (dev._removing) {                            // manually remove, should unregister all things
        dev.get('gadTable').forEach(function (rec) {
            var gad = fb.find('gadget', rec.gadId);
            if (gad)
                gad._fire('_nc:gadLeaving', { gad: gad });
        });

        fb.unregister('device', dev, function (err) {
            if (err)
                fb._fireup(UPEVT.ERROR, err, err);
            else
                fb._fireup(UPEVT.DEV_LEAVING, fbMsg, wsMsg);
        });
    }
};

listeners.ncGadIncoming = function (msg) {  // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findFromNetcore(ncName, 'device', msg.permAddr),
        gad = fb.findFromNetcore(ncName, 'gadget', msg.permAddr, msg.auxId),
        gadIn,
        fbMsg = { gad: null },
        wsMsg = { netcore: ncName, id: null, data: null},
        doGadCook,
        syncTimes = 0;

    if (!dev)
        return; // device not found, ignore this gad incoming

    dev._poke();
    gadIn = new Gadget(dev, msg.auxId, msg.raw);
    dev.set('net', { status: 'online' });

    if (typeof nc.cookRawGad !== 'function')
        return; // no cooker, do nothing

    doGadCook = function () {
        // This is used to sync gadIncoming
        if (dev.get('id') === null) {
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
                gad.set('_raw', gadIn.get('raw'));
                gad.set('panel', gadIn.get('panel'));   // 'panelChanged'
                gad.set('attrs', gadIn.get('attrs'));   // 'attrsChanged'
                gad.extra = gadIn.extra;
            } else if (nc.isJoinable()) {
                fb.register('gadget', gadIn, function (err, id) {
                    if (!err) {
                        gadIn.enable();
                        fbMsg.gad = gadIn;
                        wsMsg.id = gadIn.get('id');
                        wsMsg.data = gadIn._dumpGadInfo();      // [TODO] _dumpGadInfo
                        fb._fireup(UPEVT.GAD_INCOMING, fbMsg, wsMsg);
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
        gadId = msg.gad.get('id'),
        fbMsg = { id: gadId },
        wsMsg = { netcore: ncName, id: gadId };

    fb.unregister('gadget', msg.gad, function (err) {
        if (err)
            fb._fireup(UPEVT.ERROR, err, err); // if fails, gad won't be removed
        else
            fb._fireup(UPEVT.GAD_LEAVING, fbMsg, wsMsg);
    });
};

listeners.ncDevReporting = function (msg) { // { netcore: nc, permAddr: permAddr, data: devAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findFromNetcore(ncName, 'device', msg.permAddr),
        fbMsg = { dev: null, data: msg.data },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (!dev)
        return;

    fbMsg.dev = dev;
    wsMsg.id = dev.get('id');
    dev._poke();
    dev.set('attrs', msg.data);     // 'attrsChanged'
    dev.set('net', { status: 'online' });
    fb._fireup(UPEVT.DEV_REPORTING, fbMsg, wsMsg);
};

listeners.ncGadReporting = function (msg) { // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findFromNetcore(ncName, 'device', msg.permAddr),
        gad = fb.findFromNetcore(ncName, 'gadget', msg.permAddr, msg.auxId),
        fbMsg = { gad: null, data: msg.data },
        wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (dev) {
        dev._poke();
        dev.set('net', { status: 'online' });
    }

    if (!gad)
        return;

    fbMsg.gad = gad;
    wsMsg.id = gad.get('id');
    if (!msg.appendFlag)
        gad.set('attrs', msg.data);                 // 'attrsChanged'
    else 
        gad._dangerouslyAppendAttrs(msg.data);  // 'attrsAppend'
    fb._fireup(UPEVT.GAD_REPORTING, fbMsg, wsMsg);
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
    this._fireup(UPEVT.ERROR, msg, msg);
};

listeners.devNetChanged = function (msg) {
    return updateComponent(this, 'dev', 'net', msg);
};

listeners.devPropsChanged = function (msg) {
    return updatePropsComponent(this, 'dev', 'props', msg);
};

listeners.devAttrsChanged = function (msg) {
    return updateComponent(this, 'dev', 'attrs', msg);
};

listeners.gadPanelChanged = function (msg) {
    return updateComponent(this, 'gad', 'panel', msg);
};

listeners.gadPropsChanged = function (msg) {
    return updatePropsComponent(this, 'gad', 'props', msg);
};

listeners.gadAttrsChanged = function (msg) {
    return updateComponent(this, 'gad', 'attrs', msg);
};

listeners.gadAttrsAppend = function (msg) {
    // msg: { netcore: nc, gad: gad, data: attrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        id = msg.gad.get('id'),
        attrs = msg.data,
        fbMsg = { data: attrs },
        wsMsg = { netcore: ncName, data: attrs };

    wsMsg.id = id;
    this._gadbox.replace(id, 'attrs', attrs, function (err, diff) {
        if (err) {
            fb._fireup(UPEVT.ERROR, err, err);
        }

        fb._fireup(UPEVT.GAD_ATTRS_CHANGED, fbMsg, wsMsg);      // instance always been changed
    });
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
        wsMsg = { netcore: ncName, permAddr: permAddr },
        evtName = getBanndedEventName(type, indType),
        component;

    if (type === 'dev') {
        component = fb.findFromNetcore(ncName, 'device', permAddr);
        fbMsg.raw = msg.raw;
        if (component) {
            fb.net.remove(ncName, permAddr, function (err) {
                if (err)
                    console.log(err);   // log
            });
        }
    } else if (type === 'gad') {
        component = fb.findFromNetcore(ncName, 'gadget', permAddr, msg.auxId);
        fbMsg.auxId = msg.auxId;
        fbMsg.data = msg.data;
        wsMsg.auxId = msg.auxId;
        if (component)
            component._fire('_nc:gadLeaving', { gad: component });
    }

    fb._fireup(evtName, fbMsg, wsMsg);

    if (cb)
        cb();
}

function getBanndedEventName(type, indType) {
    var evt;

    if (type === 'dev') {
        if (indType === 'bannedReport')
            evt = UPEVT.DEV_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = UPEVT.DEV_BAN_INCOMING;
    } else if (type === 'gad') {
        if (indType === 'bannedReport')
            evt = UPEVT.GAD_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = UPEVT.GAD_BAN_INCOMING;
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
        id = wsMsg.id = msg.dev.get('id');
        box = fb._devbox;
    } else if (type === 'gad') {
        msg.gad.get('device');   // [TODO] ????
        fbMsg.gad = msg.gad;
        id = wsMsg.id = msg.gad.get('id');
        box = fb._gadbox;
    }

    box.modify(id, namespace, delta, function (err, diff) {
        if (err) {
            fb._fireup(UPEVT.ERROR, err, err);
        }

        fb._fireup(evtName, fbMsg, wsMsg);      // instance always been changed

        if (evtName === UPEVT.NET_CHANGED && delta.status) {
             fb._fireup(UPEVT.STATUS_CHANGED, {
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

function updatePropsComponent(fb, type, namespace, msg, cb) {
    // type = 'dev', msg: { netcore: nc, dev: dev, data: delta }
    // type = 'gad' ,msg: { netcore: nc, gad: gad, data: delta }
    var ncName = msg.netcore.getName(),
        id,
        delta = msg.data,
        fbMsg = { data: delta },                     // + dev or gad
        wsMsg = { netcore: ncName, data: delta },    // + id: devId or gadId,
        evtName = getUpdateEventName(type, namespace),
        box,
        newProps;

    if (type === 'dev') {
        fbMsg.dev = msg.dev;
        id = wsMsg.id = msg.dev.get('id');
        box = fb._devbox;
    } else if (type === 'gad') {
        msg.gad.get('device');   // [TODO] ????
        fbMsg.gad = msg.gad;
        id = wsMsg.id = msg.gad.get('id');
        box = fb._gadbox;
    }

    newProps = box.get(id).getProps();
    box.replace(id, namespace, newProps, function (err) {
        if (err) {
            fb._fireup(UPEVT.ERROR, err, err);
        }

        fb._fireup(evtName, fbMsg, wsMsg);      // instance always been changed

        if (cb)
            cb(err, delta);
    });
}

function getUpdateEventName(type, namespace) {
    var evtName;

    if (type === 'dev') {
        if (namespace === 'net')
            evtName = UPEVT.NET_CHANGED;
        else if (namespace === 'props')
            evtName = UPEVT.DEV_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = UPEVT.DEV_ATTRS_CHANGED;
    } else if (type === 'gad') {
        if (namespace === 'panel')
            evtName = UPEVT.PANEL_CHANGED;
        else if (namespace === 'props')
            evtName = UPEVT.GAD_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = UPEVT.GAD_ATTRS_CHANGED;
    }

    return evtName;
}

module.exports = listeners;
