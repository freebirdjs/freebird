var EventEmitter = require('events'),
    _ = require('lodash');

var Storage = require('Storage'),
    wsApis = require('./components/ws_apis'),
    drvApis = require('./components/driver_apis');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

function Freebird() {
    this._plugins = [];
    this._devbox = new Storage(devboxPath, 6000);
    this._gadbox = new Storage(gadboxPath, 18000);
    this._netcores = [];

    this._wsApis = {    // bind methods by bindWsApis()
        net: {},
        dev: {},
        gad: {}
    };

    this.net = {};      // bind methods by bindDrivers()
    thie.dev = {};
    this.gad = {};

    bindWsApis(this);
    bindDrivers(this);
}

util.inherits(Freebird, EventEmitter);
module.exports = Freebird;

Freebird.prototype.getNetcore = function (ncName) {
    return this._netcores.find(function (core) {
        return core.getName() === ncName;
    });
};

Freebird.prototype.findDev = function (pred) {
    return this._devbox.find(pred);
};

Freebird.prototype.findGad = function (pred) {
    return this._gadbox.find(pred);
};

Freebird.prototype.findDevByAddr = function (ncName, permAddr) {
    return this.findDev(function (dev) {
        return (dev.getPermAddr() === permAddr) && (dev.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.findGadByAddrAuxId = function (ncName, permAddr, auxId) {
    return this.findGad(function (gad) {
        return (gad.getPermAddr() === permAddr) && (gad.getAuxId() === auxId) && (gad.getNetcore().getName() === ncName);
    });
};

Freebird.prototype.findDevById = function (id) {
    return this._devbox.get(id);
};

Freebird.prototype.findGadById = function () {
    return this._gadbox.get(id);
};

Freebird.prototype.findWsApi = function (namespace, apiName) {
    var space = this._wsApis[namespace];
    return space ? space[apiName] : undefined;
};

Freebird.prototype.getAllGads = function (nc) {

};
Freebird.prototype.updateDevAttrs = function () {

};
Freebird.prototype.updateGadAttrs = function () {

};
Freebird.prototype.getDevIdsInNetcore = function (core) { };
Freebird.prototype.getBlacklistInNetcore = function (core) { };
Freebird.prototype.maintain = function (core) { };


/***********************************************************************/
/*** simen's part: pseudo code here                                  ***/
/*** Put all Device and Gadget work from netcore to freebird         ***/
/***********************************************************************/
fb.on('_nc:error', function (msg) {
    // {
    //    netcore: Object,
    //    error: Error
    // }
    _ncErrorHdlr(msg);
});

fb.on('_nc:enabled', function (msg) {
    // { netcore: Object }
    _ncEnabledHdlr(msg);
});

fb.on('_nc:disabled', function (msg) {
    // { netcore: Object }
    _ncDisabledHdlr(msg);
});

fb.on('_nc:devIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    raw: device raw data
    // }
    _ncDevIncomingHdlr(msg);
});

fb.on('_nc:devLeaving', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    // }
    _ncDevLeavingHdlr(msg);
});

fb.on('_nc:gadIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    raw: gad raw data
    // }
    _ncGadIncomingHdlr(msg);
});

fb.on('_nc:devAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    attrs: Object
    // }
    _ncDevAttrsReportHdlr(msg);
});

fb.on('_nc:gadAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    _ncGadAttrsReportHdlr(msg);
});

// (1) dev status changed
// (2) dev enabled
// (3) gad enabled

function ncErrorHdlr(msg) {
    // err, err.info = { netcore: ncName }
    //-- { netcore: nc, error: err }
}
function ncStartedHdlr(msg) {
    // { netcore: nc }
}
function ncStoppedHdlr(msg) {
    // { netcore: nc }
}
function ncEnabledHdlr(msg) {
    // { netcore: nc }
}
function ncDisabledHdlr(msg) {
    // { netcore: nc }
}
function ncPermitJoinHdlr(msg) {
    // { netcore: nc, timeLeft: ticks }
}
function ncDevIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
}
function ncBannedDevIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, raw: rawDev }
}
function ncDevLeavingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr }
}
function ncGadIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
}
function ncBannedGadIncomingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, raw: rawGad }
}
function ncDevReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
}
function ncBannedDevReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, data: devAttrs }
}
function ncGadReportingHdlr(msg) {
    // { netcore: nc, permAddr: permAddr, auxId: auxId, data: gadAttrs }
}
function ncBannedGadReportingHdlr(msg) {
    // { netcore: nc, permAddr, auxId: auxId, data: gadAttrs }
}

// netcore
// emit { netcore: this }  < merge data
// self._fbEmit('_nc:error', { error: err });
// self._fbEmit('_nc:permitJoin', { timeLeft: self._joinTicks });
// self._fbEmit('_nc:started');
// self._fbEmit('_nc:stopped');
// this._fbEmit('_nc:enabled');
// self._fbEmit('_nc:disabled');
// this._fbEmit('_nc:devIncoming', { permAddr: permAddr, raw: rawDev }); 

// this._fbEmit('_nc:bannedDevIncoming', { permAddr: permAddr, raw: rawDev }); 
// this._fbEmit('_nc:devLeaving', { permAddr: permAddr });
// this._fbEmit('_nc:gadIncoming', { permAddr: permAddr, auxId: auxId, raw: rawGad });
// this._fbEmit('_nc:bannedGadIncoming', { permAddr: permAddr, auxId: auxId, raw: rawGad });

// this._fbEmit('_nc:devReporting', { permAddr: permAddr, data: devAttrs });
// this._fbEmit('_nc:bannedDevReporting', { permAddr: permAddr, data: devAttrs });
// this._fbEmit('_nc:gadReporting', { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs });
// this._fbEmit('_nc:bannedGadReporting', { netcore: this, permAddr: permAddr, auxId: auxId, data: gadAttrs });
function devErrorHdlr(msg) {
    // err, err.info = { netcore: ncName, dev: id }
}
function devNetChangedHdlr(msg) {
    // { dev: dev, data: { enabled: true } }
    // { dev: dev, data: delta }
    // { dev: dev, data: { traffic: { out: _.cloneDeep(this._net.traffic.out) } } }
}
function devNetChangedHdlr(msg) {
    // { dev: dev, data: { enabled: true } }
}
function devPropsChangedHdlr(msg) {
    // { dev: dev, data: delta }
}
function devAttrsChangedHdlr(msg) {
    // { dev: dev, data: delta }
}
// device
// emitData = isErrEvt ? _.assign(data, { dev: this.getId() }) : _.assign(data, { dev: this });

// this._fbEmit('_dev:netChanged', { data: { enabled: true } });
// this._fbEmit('_dev:netChanged', { data: delta });
// this._fbEmit('_dev:propsChanged', { data: delta });
// this._fbEmit('_dev:attrsChanged', { data: delta });
// this._fbEmit('_dev:netChanged', { data: { traffic: { out: _.cloneDeep(this._net.traffic.out) } } });
// this._fbEmit('_dev:netChanged', { data: { traffic: { in: _.cloneDeep(this._net.traffic.in) } } });
// this._fbEmit('_dev:error', { error: err });

function gadPanelChangedHdlr(msg) {
    // { gad: gad, data: { enabled: true } }
    // { gad: gad, data: delta }
}
function gadPropsChangedHdlr(msg) {
    // { gad: gad, data: delta }
}
function gadAttrsChangedHdlr(msg) {
    // { gad: gad, data: delta }
}
// gadget
// emitData = _.assign(data, { gad: this });
// this._fbEmit('_gad:panelChanged', { data: { enabled: true } });
// this._fbEmit('_gad:panelChanged_Disabled', { data: { enabled: false } });
// this._fbEmit('_gad:panelChanged', { data: delta });
// this._fbEmit('_gad:propsChanged', { data: delta });
// this._fbEmit('_gad:attrsChanged', { data: delta });


function bindWsApis(fb) {
    fb._wsApis = {    // bind methods by bindWsApis()
        net: {
            getAllDevIds: wsApis.getAllDevIds.bind(fb),
            getAllGadIds: wsApis.getAllGadIds.bind(fb),
            getDevs: wsApis.getDevs.bind(fb),
            getGads: wsApis.getGads.bind(fb),
            getNetcores: wsApis.getNetcores.bind(fb),
            getBlacklist: wsApis.getBlacklist.bind(fb),
            permitJoin: wsApis.permitJoin.bind(fb),
            maintain: wsApis.maintain.bind(fb),
            reset: wsApis.reset.bind(fb), 
            enable: wsApis.enable.bind(fb), 
            disable: wsApis.disable.bind(fb),  
            ban: wsApis.ban.bind(fb), 
            unban: wsApis.unban.bind(fb), 
            remove: wsApis.remove.bind(fb), 
            ping: wsApis.ping.bind(fb)
        },
        dev: {
            read: wsApis.devRead.bind(fb),
            write: wsApis.devWrite.bind(fb),
            identify: wsApis.devIdentify.bind(fb)
        },
        gad: {
            read: wsApis.gadRead.bind(fb),
            write: wsApis.gadWrite.bind(fb),
            exec: wsApis.gadExec.bind(fb),
            setReportCfg: wsApis.gadSetReportCfg.bind(fb),
            getReportCfg: wsApis.gadGetReportCfg.bind(fb)
        }
    };
}

function bindDrivers(fb) {
    fb.net = {
        start: drvApis.start.bind(fb),
        stop: drvApis.stop.bind(fb),
        reset: drvApis.reset.bind(fb),
        permitJoin: drvApis.permitJoin.bind(fb),
        remove: drvApis.remove.bind(fb),
        ban: drvApis.ban.bind(fb),
        unban: drvApis.unban.bind(fb),
        ping: drvApis.ping.bind(fb),
        // maintain: drvApis.start.bind(fb), [No driver?]
        // enable
        // diable
    };

    fb.dev = {
        read: drvApis.devRead.bind(fb),
        write: drvApis.devWrite.bind(fb),
        identify: drvApis.devIdentify.bind(fb)
    };

    fb.gad = {
        read: drvApis.gadRead.bind(fb),
        write: drvApis.gadWrite.bind(fb),
        exec: drvApis.gadExec.bind(fb),
        setReportCfg: drvApis.gadSetReportCfg.bind(fb),
        getReportCfg: drvApis.gadGetReportCfg.bind(fb)
    };
}