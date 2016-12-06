// netcore event handlers
'use strict';
var validate;

var _ = require('busyman'),
    FreebirdBase = require('freebird-base'),
    FreebirdConsts = require('freebird-constants');

var utils = require('../utils/utils');

var Device = FreebirdBase.Device,
    Gadget = FreebirdBase.Gadget,
    EVT_TOP = FreebirdConsts.EVENTS_TO_TOP,
    EVT_BTM = FreebirdConsts.EVENTS_FROM_BOTTOM;

var handlers = {};

// all 'this' in the handler fuctions will be bound to freebird
/***********************************************************************/
/*** Netcore Event Listeners                                         ***/
/***********************************************************************/
handlers.ncError = function (err) {         // err, err.info = { netcore: ncName }
    this._fire(EVT_TOP.ERROR, err.message);

    this._tweet('net', 'error', 0, {
        netcore: 'xxxx' // [TODO]
    });
};

// v, ok
handlers.ncEnabled = function (msg) {       // { netcore: nc }
    var ncName = msg.netcore.getName();

    this._fire(EVT_TOP.NC_ENABLED, msg);
    this._tweet('net', 'enabled', 0, { netcore: ncName });
};

// v, ok
handlers.ncDisabled = function (msg) {      // { netcore: nc }
    var ncName = msg.netcore.getName();

    this._fire(EVT_TOP.NC_DISABLED, msg);
    this._tweet('net', 'disabled', 0, { netcore: ncName });
};

// v, ok
handlers.ncStarted = function (msg) {       // { netcore: nc }
    var ncName = msg.netcore.getName();

    this._fire(EVT_TOP.NC_STARTED, msg);
    this._tweet('net', 'started', 0, { netcore: ncName });
};

// v, ok
handlers.ncStopped = function (msg) {       // { netcore: nc }
    var ncName = msg.netcore.getName();

    this._fire(EVT_TOP.NC_STOPPED, msg);
    this._tweet('net', 'stopped', 0, { netcore: ncName });
};

/***********************************************************************/
/*** tackle device and gadget incoming, leaving, and reporting       ***/
/***********************************************************************/
// v => ncNetReady
handlers.ncReady = function (msg) {         // { netcore: nc }
    // No tweeting

    // this._tweet(EVT_TOP.NET_READY, msg);

    // this._tweet('net', 'stopped', 0, {
    //     netcore: msg.netcore.getName()
    // });
};

// v, ok
handlers.ncPermitJoin = function (msg) {    // { netcore: nc, timeLeft: ticks }
    var ncName = msg.netcore.getName();

    this._fire(EVT_TOP.NC_PERMIT_JOIN, msg);
    this._tweet('net', 'permitJoining', 0, { netcore: ncName, timeLeft: msg.timeLeft });
};

// v, ok
handlers.ncDevIncoming = function (msg) {   // { netcore: nc, permAddr: permAddr, raw: rawDev }
    var freebird = this,
        nc = msg.netcore,
        dev, devIn;

    if (!_.isFunction(nc.cookRawDev))       // no cooker, do nothing
        return freebird._tweet(EVT_TOP.ERROR, new Error('Raw device cooker, cookRawDev(), is not implemeneted on netcore: ' + nc.getName()));

    dev = freebird.findByNet('device', nc.getName(), msg.permAddr);
    devIn = new Device(nc, msg.raw);

    nc.cookRawDev(devIn, msg.raw, function (err, brewedDev) {
        if (err)
            return freebird._tweet(EVT_TOP.ERROR, err);

        devIn = brewedDev;

        if (dev) {  // dev already exists, no need to fire EVT_TOP.DEV_INCOMING
            dev._poke();
            dev.set('_raw', devIn.get('raw'));      // should call set('_raw', raw) to reset raw (safe for recoverd device)
            dev.extra = devIn.extra;                // should assign extra (safe for recoverd device)

            dev.set('net', devIn.get('net'));       // set('net', info) will find out network changes and report
            dev.set('attrs', devIn.get('attrs'));   // set('attrs', attrs) will find out attribute changes and report
            dev.set('net', { status: 'online' });
        } else if (nc.isJoinable()) {
            freebird.register('device', devIn, function (err, id) {   // joinTime tagged in freebird.register('device')
                if (err) {
                    devIn = null;
                    freebird._tweet(EVT_TOP.ERROR, err, err);         // register fail
                } else {
                    devIn.enable();
                    devIn._poke();
                    devIn.set('net', { status: 'online' });

                    freebird._fire(EVT_TOP.DEV_INCOMING, dev);
                    freebird._tweet('dev', 'devIncoming', devIn.get('id'), utils.dumpDeviceInfo(devIn);
                }
            });
        } else {
            return; // do nothing if netcore is not allowed for joining
        }
    });
};

// v [TODO]
handlers.ncDevLeaving = function (msg) {   // { netcore: nc, permAddr: permAddr }
    var freebird = this,
        nc = msg.netcore,
        dev = freebird.findByNet('device', nc.getName(), msg.permAddr),
        devId;

    if (!dev)
        return; // dev not found, do nothing

    dev._poke();
    devId = dev.get('id');
    dev.set('net', { status: 'offline' });          // 'netChanged', 'statusChanged'

    if (dev._removing) {                            // manually remove, should unregister all things
        // [TODO] Should unregister here, or cannot sync

        dev.get('gadTable').forEach(function (rec) {
            var gad = freebird.findById('gadget', rec.gadId);
            if (gad)
                gad._fire(EVT_BTM.NcGadLeaving, { netcore: nc, gad: gad }); // Internal Event [TODO] Dont use event
        });

        freebird.unregister('device', dev, function (err) {
            if (err)
                freebird._tweet(EVT_TOP.ERROR, err);
            else
                freebird._tweet(EVT_TOP.DEV_LEAVING, { netcore: nc, permAddr: msg.permAddr, id: devId });
        });
    }
};

// [TODO] devStatusChanged
// v [TODO]  devNetChanged => @updateComponent
handlers.ncDevNetChanging = function (msg) {    // { netcore: nc, permAddr: permAddr, data: changes }
    var dev = this.findByNet('device', msg.netcore.getName(), msg.permAddr);

    if (dev)
        dev.set('net', msg.data);   // device will check changes and then fire event: EVT_TOP.DevNetChanged
};

// v
handlers.ncDevReporting = function (msg) {      // { netcore: nc, permAddr: permAddr, data: devAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findByNet('device', ncName, msg.permAddr);
        // fbMsg = { dev: null, data: msg.data },
        // wsMsg = { netcore: ncName, id: null, data: msg.data };

    if (!dev)
        return;

    msg.devId = dev.get('id');

    dev._poke();
    dev.set('net', { status: 'online' });
    dev.set('attrs', msg.data);             // 'attrsChanged'

    fb._tweet(EVT_TOP.DEV_REPORTING, msg);
};  // { netcore: nc, devId: id, permAddr: permAddr, data: devAttrs }

// v
handlers.ncGadIncoming = function (msg) {  // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
    var fb = this,
        nc = msg.netcore,
        ncName = nc.getName(),
        dev = fb.findFromNetcore(ncName, msg.permAddr),
        gad = fb.findFromNetcore(ncName, msg.permAddr, msg.auxId),
        gadIn,
        fbMsg = { gad: null },
        wsMsg = _makeWsMsg(msg, { id: null, data: null }),
        doGadCook,
        syncTimes = 0;

    if (!dev)
        return; // device not found, ignore this gad incoming

    dev._poke();
    dev.set('net', { status: 'online' });

    if (!_.isFunction(nc.cookRawGad)) {
        var noCookerError = new Error('Raw gadget cooker, cookRawGad(), is not implemeneted on netcore: ' + ncName);
        fb._tweet(EVT_TOP.ERROR, noCookerError, noCookerError);
        return; // no cooker, do nothing
    }

    gadIn = new Gadget(dev, msg.auxId, msg.raw);

    doGadCook = function () {
        // This is used to sync gadIncoming
        if (_.isNil(dev.get('id'))) {
            if (++syncTimes > 50) // try resync for 1 second, discard this gadIncoming message if fails
                return;

            return setTimeout(function () {
                doGadCook();
            }, 20);
        }

        nc.cookRawGad(gadIn, msg.raw, function (err, brewedGad) {
            gadIn = brewedGad;

            if (gad) {
                gad.set('_raw', gadIn.get('raw'));
                gad.extra = gadIn.extra;
                gad.set('panel', gadIn.get('panel'));   // 'panelChanged'
                gad.set('attrs', gadIn.get('attrs'));   // 'attrsChanged'
            } else if (nc.isJoinable()) {
                fb.register('gadget', gadIn, function (err, id) {
                    if (err) {
                        gadIn = null;
                        fb._tweet(EVT_TOP.ERROR, err, err);      // register fail
                    } else {
                        gadIn.enable();
                        fbMsg.gad = gadIn;
                        wsMsg.id = gadIn.get('id');
                        wsMsg.data = utils.dumpGadgetInfo(gadIn);
                        fb._tweet(EVT_TOP.GAD_INCOMING, fbMsg, wsMsg);
                    }
                });
            }
        });
    };

    doGadCook();
};

// v
// internal event: from ncDevLeaving()
handlers.ncGadLeaving = function (msg) {   // { gad: gad }
    var fb = this,
        ncName = msg.netcore.getName(),
        gadId = msg.gad.get('id'),
        fbMsg = { id: gadId },
        wsMsg = { netcore: ncName, id: gadId };

    fb.unregister('gadget', msg.gad, function (err) {
        if (err)
            fb._tweet(EVT_TOP.ERROR, err, err); // if fails, gad won't be removed
        else
            fb._tweet(EVT_TOP.GAD_LEAVING, fbMsg, wsMsg);
    });
};

// v
handlers.ncGadReporting = function (msg) { // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        dev = fb.findFromNetcore(ncName, msg.permAddr),
        gad = fb.findFromNetcore(ncName, msg.permAddr, msg.auxId),
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
    fb._tweet(EVT_TOP.GAD_REPORTING, fbMsg, wsMsg);
};

/***********************************************************************/
/*** tackle banned device and gadget events                          ***/
/***********************************************************************/
handlers.ncBannedDevIncoming = function (msg) {
    return bannedComponent(this, 'device', 'bannedIncoming', msg);
};

handlers.ncBannedDevReporting = function (msg) {
    return bannedComponent(this, 'device', 'bannedReport', msg);
};

handlers.ncBannedGadIncoming = function (msg) {
    return bannedComponent(this, 'gadget', 'bannedIncoming', msg);
};

handlers.ncBannedGadReporting = function (msg) {
    return bannedComponent(this, 'gadget', 'bannedReport', msg);
};

/***********************************************************************/
/*** device and gadget events: instance has been changed             ***/
/***********************************************************************/
handlers.devError = function (msg) {       // { error: err }: err, err.info = { netcore: ncName, dev: id }
    // console.log('#########################');
    // console.log(msg);
    this._tweet(EVT_TOP.ERROR, msg, msg);
};

// v
handlers.devNetChanged = function (msg) {
    return updateComponent(this, 'dev', 'net', msg);
};

// v
handlers.devPropsChanged = function (msg) {
    return updatePropsComponent(this, 'dev', 'props', msg);
};

// v
handlers.devAttrsChanged = function (msg) {
    return updateComponent(this, 'dev', 'attrs', msg);
};

// v
handlers.gadPanelChanged = function (msg) {
    return updateComponent(this, 'gad', 'panel', msg);
};

// v
handlers.gadPropsChanged = function (msg) {
    return updatePropsComponent(this, 'gad', 'props', msg);
};

// v
handlers.gadAttrsChanged = function (msg) {
    return updateComponent(this, 'gad', 'attrs', msg);
};

handlers.gadAttrsAppend = function (msg) {
    // msg: { netcore: nc, gad: gad, data: attrs }
    var fb = this,
        ncName = msg.netcore.getName(),
        id = msg.gad.get('id'),
        attrs = msg.data,
        fbMsg = { gad: msg.gad, data: attrs },
        wsMsg = { netcore: ncName, id: null, data: attrs };

    wsMsg.id = id;
    this._gadbox.replace(id, 'attrs', attrs, function (err, diff) {
        if (err) {
            fb._tweet(EVT_TOP.ERROR, err, err);
        }

        fb._tweet(EVT_TOP.GAD_ATTRS_CHANGED, fbMsg, wsMsg);      // instance always been changed
    });
};

/***********************************************************************/
/*** Private Functions                                               ***/
/***********************************************************************/
function bannedComponent(fb, type, indType, msg, cb) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }         - bannedDevIncoming
    // { netcore: nc, permAddr, auxId: auxId, raw: rawGad }     - bannedGadIncoming
    // { netcore: nc, permAddr: permAddr, data: attrs }         - bannedDevReporting
    // { netcore: nc, permAddr, auxId: auxId, data: attrs }     - bannedGadReporting

    var nc = msg.netcore,
        ncName = nc.getName(),
        permAddr = msg.permAddr,
        upMsg = { netcore: nc, permAddr: permAddr },
        evtName = getBanndedEventName(type, indType),
        component;

    if (type === 'device') {
        component = fb.findByNet(type, ncName, permAddr);
        if (component) {
            nc.remove(permAddr, function (err) {
                if (err)
                    fb._tweet('dev', 'error', component.get('id'), err.message);
            });
        }
    } else if (type === 'gadget') {
        component = fb.findByNet(type, ncName, permAddr, msg.auxId);

        upMsg.auxId = msg.auxId;
        upMsg.data = msg.data;

        if (component)
            component._fire(EVT_BTM.NcGadLeaving, { netcore: nc gad: component });  // Internal Event
    }

    fb._tweet(evtName, upMsg);  // [TODO]

    if (cb)
        cb();
}

function getBanndedEventName(type, indType) {
    var evt;

    if (type === 'dev') {
        if (indType === 'bannedReport')
            evt = EVT_TOP.DEV_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = EVT_TOP.DEV_BAN_INCOMING;
    } else if (type === 'gad') {
        if (indType === 'bannedReport')
            evt = EVT_TOP.GAD_BAN_REPORTING;
        else if (indType === 'bannedIncoming')
            evt = EVT_TOP.GAD_BAN_INCOMING;
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
            fb._tweet(EVT_TOP.ERROR, err, err);
        }

        fb._tweet(evtName, fbMsg, wsMsg);      // instance always been changed

        if (evtName === EVT_TOP.NET_CHANGED && delta.status) {
             fb._tweet(EVT_TOP.STATUS_CHANGED, {
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
            fb._tweet(EVT_TOP.ERROR, err, err);
        }

        fb._tweet(evtName, fbMsg, wsMsg);      // instance always been changed

        if (cb)
            cb(err, delta);
    });
}

function getUpdateEventName(type, namespace) {
    var evtName;

    if (type === 'dev') {
        if (namespace === 'net')
            evtName = EVT_TOP.NET_CHANGED;
        else if (namespace === 'props')
            evtName = EVT_TOP.DEV_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = EVT_TOP.DEV_ATTRS_CHANGED;
    } else if (type === 'gad') {
        if (namespace === 'panel')
            evtName = EVT_TOP.PANEL_CHANGED;
        else if (namespace === 'props')
            evtName = EVT_TOP.GAD_PROPS_CHANGED;
        else if (namespace === 'attrs')
            evtName = EVT_TOP.GAD_ATTRS_CHANGED;
    }

    return evtName;
}

module.exports = function attachEventListeners(freebird) {
    var ncLsns;

    freebird._ncEventListeners = freebird._ncEventListeners || {};
    ncLsns = freebird._ncEventListeners;

    // [TODO] remove listeners

    // Firstly bind the handlers to freebird
    _.forEach(handlers, function (lsn, key) {
        ncLsns[key] = lsn.bind(freebird);
    });

    // Then, attach the handlers to events
    freebird.on(EVT_BTM.NcError, ncLsns.ncError);                           // { netcore, error: err }
    freebird.on(EVT_BTM.NcEnabled, ncLsns.ncEnabled);
    freebird.on(EVT_BTM.NcDisabled, ncLsns.ncDisabled);
    freebird.on(EVT_BTM.NcStarted, ncLsns.ncStarted);
    freebird.on(EVT_BTM.NcStopped, ncLsns.ncStopped);
    freebird.on(EVT_BTM.NcReady, ncLsns.ncReady);                           // { netcore }
    freebird.on(EVT_BTM.NcPermitJoin, ncLsns.ncPermitJoin);                 // { netcore, timeLeft: self._joinTicks }

    freebird.on(EVT_BTM.NcDevIncoming, ncLsns.ncDevIncoming);               // { netcore, permAddr: permAddr, raw: rawDev }
    freebird.on(EVT_BTM.NcDevLeaving, ncLsns.ncDevLeaving);                 // { netcore, permAddr: permAddr }
    freebird.on(EVT_BTM.NcDevNetChanging, ncLsns.ncDevNetChanging);         // { netcore, permAddr: permAddr, data: changes }
    freebird.on(EVT_BTM.NcDevReporting, ncLsns.ncDevReporting);             // { netcore, permAddr: permAddr, data: devAttrs }

    freebird.on(EVT_BTM.NcGadIncoming, ncLsns.ncGadIncoming);               // { netcore, permAddr: permAddr, auxId: auxId, raw: rawGad }
    freebird.on(EVT_BTM.NcGadLeaving, ncLsns.ncGadLeaving);                 // { netcore, gad: gad }, internal event, not pass from low-level
    freebird.on(EVT_BTM.NcGadReporting, ncLsns.ncGadReporting);             // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }

    freebird.on(EVT_BTM.NcBannedDevIncoming, ncLsns.ncBannedDevIncoming);   // { netcore, permAddr: permAddr, raw: rawDev }
    freebird.on(EVT_BTM.NcBannedDevReporting, ncLsns.ncBannedDevReporting); // { netcore, permAddr: permAddr, data: devAttrs }

    freebird.on(EVT_BTM.NcBannedGadIncoming, ncLsns.ncBannedGadIncoming);   // { netcore, permAddr: permAddr, auxId: auxId, raw: rawGad }
    freebird.on(EVT_BTM.NcBannedGadReporting, ncLsns.ncBannedGadReporting); // { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs }

    freebird.on(EVT_BTM.DevError, ncLsns.devError);                         // { error: err }
    freebird.on(EVT_BTM.DevNetChanged, ncLsns.devNetChanged);               // { data: delta }, setNetInfo
    freebird.on(EVT_BTM.DevPropsChanged, ncLsns.devPropsChanged);           // { data: delta }, setProps
    freebird.on(EVT_BTM.DevAttrsChanged, ncLsns.devAttrsChanged);           // { data: delta }, setAttrs

    freebird.on(EVT_BTM.GadError, ncLsns.gadError);                         // { error: err }
    freebird.on(EVT_BTM.GadPanelChanged, ncLsns.gadPanelChanged);           // { data: delta }, setPanelInfo
    freebird.on(EVT_BTM.GadPropsChanged, ncLsns.gadPropsChanged);           // { data: delta }, setProps
    freebird.on(EVT_BTM.GadAttrsChanged, ncLsns.gadAttrsChanged);           // { data: delta }, setAttrs
    freebird.on(EVT_BTM.GadAttrsAppend, ncLsns.gadAttrsAppend);             // { data: attrs }, _dangerouslySetAttrs
};

// [TODO] HOW TO DEAL WITH ERROR MESSAGES?