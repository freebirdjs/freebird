var listeners = {};

// all 'this' in the fuctions will be bound to freebird

listeners.ncError = function (err) {
    // err, err.info = { netcore: ncName }
    //-- { netcore: nc, error: err }

};

listeners.ncPermitJoin = function (msg) {
    // { netcore: nc, timeLeft: ticks }

    // 'permitJoin'
};

listeners.ncStarted = function (msg) {
    // { netcore: nc }
};

listeners.ncStopped = function (msg) {
    // { netcore: nc }
};

listeners.ncEnabled = function (msg) {
    // { netcore: nc }
};

listeners.ncDisabled = function (msg) {
    // { netcore: nc }
};

listeners.ncDevIncoming = function (msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
    var fb = this,
        nc = msg.netcore,
        dev = this.findDevByAddr(nc.getName(), msg.permAddr),
        devIn = new Device(nc, msg.raw),
        delta;

    nc.cookRawDevice(devIn, msg.raw, function (err, ripeDev) {

        if (!dev) { // new one
            ripeDev.setNetInfo({ status: 'online' });
            fb.registerDev(ripeDev);
            fb.emit('devIncoming', devIn);
            // set jointime
            // save to db
            // fb._devbox.add(devIn, function (err, newId) { devIn._setId(newId) });
            // poke
        } else {    // there is a old one
            dev._setRawDev(msg.raw);
            delta = utils.getDevDiff(devIn, dev);
            // net change -> 'netChanged', 'statusChanged'
            // attrs change -> 'attrsChanged'
            // props change -> 'propsChanged'
            self.emit('devAttrsChanged', oldDev, delta);
            dev._poke();
            devIn = null;
        }
    });
};

listeners.ncBannedDevIncoming = function (msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
    var nc = msg.netcore,
        dev = this.findDevByAddr(nc.getName(), msg.permAddr);

    if (dev)
        this.unregisterDev(dev);

    // emit anyway

};

listeners.ncDevLeaving = function (msg) {
    // { netcore: nc, permAddr: permAddr }
    var nc = msg.netcore,
        dev = this.findDevByAddr(nc.getName(), msg.permAddr);

    if (dev) {
        // poke
        this.setNetInfo({ status: 'offline' }); // 'netChanged', 'statusChanged'
        // emit 'devLeaving'

    }
};

listeners.ncGadIncoming = function (msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
    var nc = msg.netcore,
        gad = this.findGadByAddrAuxId(nc.getName(), msg.permAddr, msg.auxId);
    // gad.getDev()
    if (!gad) {
        // register
        // 'gadIncoming'
    } else {
        // 'netChanged'
        // 'statusChanged'
        // 'attrsChanged'
        // poke
    }
};

listeners.ncBannedGadIncoming = function (msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
    var nc = msg.netcore,
        gad = this.findGadByAddrAuxId(nc.getName(), msg.permAddr, msg.auxId);

    if (gad) {
        this.unregisterGad(gad);
    }

    // emit anyway
};

listeners.ncDevReporting = function (msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
    var nc = msg.netcore,
        dev = this.findDevByAddr(nc.getName(), msg.permAddr);

    if (dev) {
        dev.setAttrs(msg.data); // 'attrsChanged'
        // poke
    }

    // 'netChanged'
    // 'statusChanged'
};

listeners.ncBannedDevReporting = function (msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
    var nc = msg.netcore,
        dev = this.findDevByAddr(nc.getName(), msg.permAddr);

    if (dev)
        this.unregisterDev(dev);

    // emit anyway
};

listeners.ncGadReporting = function (msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
    var nc = msg.netcore,
        gad = this.findGadByAddrAuxId(nc.getName(), msg.permAddr, msg.auxId);

    if (gad) {
        gad.setAttrs(msg.data); // 'attrsChanged'
        // 'attrReport'
    }

    // 'netChanged'
    // 'statusChanged'
};

listeners.ncBannedGadReporting = function (msg) {
    // { netcore: nc, permAddr, auxId: auxId, data: gadAttrs }
    var nc = msg.netcore,
        gad = this.findGadByAddrAuxId(nc.getName(), msg.permAddr, msg.auxId);

    if (gad) {
        this.unregisterGad(gad);
    }

    // emit anyway
};


listeners.devError = function (msg) {
    // err, err.info = { netcore: ncName, dev: id }
};

listeners.devNetChanged = function (msg) {
    // { netcore: nc, dev: dev, data: { enabled: true } }
    // { netcore: nc, dev: dev, data: delta }
    // { netcore: nc, dev: dev, data: { traffic: { out: _.cloneDeep(this._net.traffic.out) } } }
    var devId = msg.dev.getId();

    this._devbox.update(devId, 'net', msg.data, function (err, diff) {

    });
};

listeners.devPropsChanged = function (msg) {
    // { netcore: nc, dev: dev, data: delta }
    var devId = msg.dev.getId();

    this._devbox.update(devId, 'props', msg.data, function (err, diff) {

    });
};

listeners.devAttrsChanged = function (msg) {
    // { netcore: nc, dev: dev, data: delta }
    var devId = msg.dev.getId();

    this._devbox.update(devId, 'attrs', msg.data, function (err, diff) {

    });
};

listeners.gadPanelChanged = function (msg) {
    // { netcore: nc, gad: gad, data: { enabled: true } }
    // { netcore: nc, gad: gad, data: delta }
    var gadId = msg.gad.getId();

    this._gadbox.update(gadId, 'panel', msg.data, function (err, diff) {

    });
};

listeners.gadPropsChanged = function (msg) {
    // { netcore: nc, gad: gad, data: delta }
    var gadId = msg.gad.getId();

    this._gadbox.update(gadId, 'props', msg.data, function (err, diff) {

    });
};

listeners.gadAttrsChanged = function (msg) {
    // { netcore: nc, gad: gad, data: delta }
    var gadId = msg.gad.getId();

    this._gadbox.update(gadId, 'attrs', msg.data, function (err, diff) {

    });
};

module.exports = listeners;
