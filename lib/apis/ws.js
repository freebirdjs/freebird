'use strict';

var _ = require('busyman');
var utils = require('../utils/utils');

var wsApis = {};
var netApiNames = [
        'getAllDevIds', 'getAllGadIds', 'getDevs', 'getGads', 'getNetcores', 'getBlacklist', 'permitJoin', 'maintain', 
        'reset', 'enable', 'disable', 'ban', 'unban', 'remove', 'ping'
    ],
    devApiNames = [ 'read', 'write', 'identify', 'enable', 'disable', 'getProps', 'setProps' ],
    gadApiNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable', 'getProps', 'setProps' ];


wsApis.bindWsApis = function (freebird) {
    freebird._wsApis = _.isObject(freebird._wsApis) ? freebird._wsApis : {};
    freebird._wsApis.net = _.isObject(freebird._wsApis.net) ? freebird._wsApis.net : {};
    freebird._wsApis.dev = _.isObject(freebird._wsApis.dev) ? freebird._wsApis.dev : {};
    freebird._wsApis.gad = _.isObject(freebird._wsApis.gad) ? freebird._wsApis.gad : {};

    _.forEach(netApiNames, function (name) {
        freebird._wsApis.net[name] = wsApis[name].bind(freebird);
    });

    _.forEach(devApiNames, function (name) {
        freebird._wsApis.dev[name] = wsApis['dev' + _.upperFirst(name)].bind(freebird);
    });

    _.forEach(gadApiNames, function (name) {
        freebird._wsApis.gad[name] = wsApis['gad' + _.upperFirst(name)].bind(freebird);
    });
};

/**********************************************************************************/
/*** APIs for web client (websocket) - Use Freebird Drivers to Accomplish Tasks ***/
/**********************************************************************************/
wsApis.getAllDevIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;
    if (!utils.passWsArgsCheck(args, { ncName: 0 }, callback)) return;

    if (_.isNil(args.ncName))
        return utils.feedback(null, { ids: this._devbox.exportAllIds() }, callback);
    // callback will be invoked with netcore not found error in utils.obtainNetcore()
    nc = utils.obtainNetcore(this, args.ncName, callback);

    if (nc) {
        ids = this._devbox.filter('_netcore', nc).map(function (dev) {
            return dev.get('id');
        });
        return utils.feedback(null, { ids: ids }, callback);
    }
};  // return { ids: [ 1, 2, 3, 8, 12 ] }

wsApis.getAllGadIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;
    if (!utils.passWsArgsCheck(args, { ncName: 0 }, callback)) return;

    if (_.isNil(args.ncName))
        return utils.feedback(null, { ids: this._gadbox.exportAllIds() }, callback);

    nc = utils.obtainNetcore(this, args.ncName, callback);
    if (nc) {
        ids = this._gadbox.filter('_dev._netcore', nc).map(function (gad) {
            return gad.get('id');
        });
        return utils.feedback(null, { ids: ids }, callback);
    }
};  // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] }

wsApis.getDevs = function (args, callback) {        // { ids:Number[] }
    if (!utils.passWsArgsCheck(args, { ids: 1 }, callback)) return;

    var self = this,
        devs = (args.ids).map(function (id) {
        var dev = self.find('device', id);
        return dev ?  dumpDevInfo(dev) : undefined;
    });

    return utils.feedback(null, { devs: devs }, callback);
};  // return { devs: [ devInfo, ... ] }

wsApis.getGads = function (args, callback) {        // { ids:Number[] }
    if (!utils.passWsArgsCheck(args, { ids: 1 }, callback)) return;

    var self = this,
        gads = (args.ids).map(function (id) {
            var gad = self.find('gadget', id);
            return gad ? gad.dump() : undefined;
        });

    return utils.feedback(null, { gads: gads }, callback);
};  // return { gads: [ gadInfo , ... ] }

wsApis.getNetcores = function (args, callback) {    // { [ncNames:String[]] }
    var self = this,
        ncNames, ncs;

    if (!utils.passWsArgsCheck(args, { ncNames: 0 }, callback)) return;

    ncNames = args.ncNames ? args.ncNames : this._netcores.map(function (nc) {
        return nc.getName();
    });

    ncs = ncNames.map(function (name) {
        var nc = self.find('netcore', name);
        return nc ? utils.dumpNetcoreInfo(nc) : undefined;
    });

    return utils.feedback(null, { netcores: ncs }, callback);
};  // return { netcores: [ ncInfo, ... ] }

wsApis.getBlacklist = function (args, callback) {   // { ncName:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1 }, callback)) return;

    var nc = utils.obtainNetcore(this, args.ncName, callback);

    if (nc) {
        ids = this._gadbox.filter('_dev._netcore', nc).map(function (gad) {
            return gad.get('id');
        });
        return utils.feedback(null, { list: nc.getBlacklist() }, callback);
    }
};  // return { list: [ '0x00124b0001ce4b89', ... ] }

wsApis.permitJoin = function (args, callback) {     // { ncName:String, duration:Number }
    if (!utils.passWsArgsCheck(args, { ncName: 1, duration: 1 }, callback)) return;
    // callback will be invoked with driver not found error in utils.obtainDriver()
    var permitJoin = utils.obtainDriver(this, 'net', 'permitJoin', callback);
    if (permitJoin)
        permitJoin(args.ncName, args.duration, function (err, timeLeft) {
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.reset = function (args, callback) {          // { ncName:String, mode:Number } => [TODO] mode
    if (!utils.passWsArgsCheck(args, { ncName: 1 }, callback)) return;

    var HARD_RESET = 1,
        reset = utils.obtainDriver(this, 'net', 'reset', callback);

    if (reset)
        reset(args.ncName, HARD_RESET, function (err) { 
            callback(err, err ? undefined : {});
        }); // [TODO] accept mode?
};  // return {}

wsApis.enable = function (args, callback) {         // { ncName:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1 }, callback)) return;

    var enable = utils.obtainDriver(this, 'net', 'enable', callback);
    if (enable)
        enable(args.ncName, function (err) { 
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.disable = function (args, callback) {        // { ncName:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1 }, callback)) return;

    var disable = utils.obtainDriver(this, 'net', 'disable', callback);
    if (disable)
        disable(args.ncName, function (err) { 
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.ban = function (args, callback) {            // { ncName:String, permAddr:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var ban = utils.obtainDriver(this, 'net', 'ban', callback);
    if (ban)
        ban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.unban = function (args, callback) {          // { ncName:String, permAddr:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var unban = utils.obtainDriver(this, 'net', 'unban', callback);
    if (unban)
        unban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.remove = function (args, callback) {         // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var remove = utils.obtainDriver(this, 'net', 'remove', callback);
        dev = remove ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        remove(args.ncName, dev.get('permAddr'), function (err, permAddr) {
            callback(err, err ? undefined : { permAddr: permAddr });
        });
};  // return { permAddr: '0x00124b0001ce4b89' }

wsApis.ping = function (args, callback) {           // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var ping = utils.obtainDriver(this, 'net', 'ping', callback),
        dev = ping ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        ping(args.ncName, dev.get('permAddr'), function (err, time) {
            callback(err, err ? undefined : { time: time });
        });
};  // return { time: 12 }

wsApis.maintain = function (args, callback) {       // { ncName:String }
    if (!utils.passWsArgsCheck(args, { ncName: 1 }, callback)) return;

    var maintain = utils.obtainDriver(this, 'net', 'maintain', callback),
        nc = utils.obtainNetcore(this, args.ncName, callback),
        devs = nc ? this._devbox.filter('_netcore', nc) : undefined,
        devNum = _.isArray(devs) ? devs.length : 0;

    if (maintain && devs) {
        _.forEach(devs, function (dev) {
            maintain(args.ncName, dev.get('permAddr'), function (err) {
                devNum = devNum - 1;
                if (devNum === 0)
                    callback(null, {});
            });
        });
    }
};  // return {}

wsApis.devEnable = function (args, callback) {      // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var devEnable = utils.obtainDriver(this, 'dev', 'enable', callback),
        dev = devEnable ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        devEnable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { enabled: dev.isEnabled() });
        });
};  // return { enabled: true }

wsApis.devDisable = function (args, callback) {     // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var devDisable = utils.obtainDriver(this, 'dev', 'disable', callback),
        dev = devDisable ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        devDisable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { enabled: dev.isEnabled() });
        });
};  // return { enabled: false }

wsApis.devRead = function (args, callback) {        // { id:Number, attrName:String }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1 }, callback)) return;

    var devRead = utils.obtainDriver(this, 'dev', 'read', callback),
        dev = devRead ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        devRead(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 3 }

wsApis.devWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var devWrite = utils.obtainDriver(this, 'dev', 'write', callback),
        dev = devWrite ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        devWrite(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 'kitchen' }

wsApis.devIdentify = function (args, callback) {    // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var devIdentify = utils.obtainDriver(this, 'dev', 'identify', callback),
        dev = devIdentify ? utils.obtainDeviceById(this, args.id, callback) : undefined;

    if (dev)
        devIdentify(dev.get('netcore').getName(), dev.get('permAddr'), function (err) {
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.devGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (!utils.passWsArgsCheck(args, { id: 1, propNames: 0 }, callback)) return;

    var dev = utils.obtainDeviceById(this, args.id, callback),
        props;

    if (dev) {
        try {
            props = dev.get('props', args.propNames);
            return utils.feedback(null, { props: props }, callback);
        } catch (e) {
            return utils.feedback(e, null, callback);
        }
    }
};  // return { props: { name: 'xxx', location: 'xxx' } }

wsApis.devSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (!utils.passWsArgsCheck(args, { id: 1, props: 1 }, callback)) return;

    var dev = utils.obtainDeviceById(this, args.id, callback),
        props;

    if (dev) {
        try {
            dev.set('props', args.props);
            return utils.feedback(null, {}, callback);
        } catch (e) {
            return utils.feedback(e, null, callback);
        }
    }
};  // return {}

wsApis.gadEnable = function (args, callback) {      // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var gadEnable = utils.obtainDriver(this, 'gad', 'enable', callback),
        gad = gadEnable ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadEnable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { enabled: gad.isEnabled() });
        });
};  // return { enabled: true }

wsApis.gadDisable = function (args, callback) {     // { id:Number }
    if (!utils.passWsArgsCheck(args, { id: 1 }, callback)) return;

    var gadDisable = utils.obtainDriver(this, 'gad', 'disable', callback),
        gad = gadDisable ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadDisable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { enabled: gad.isEnabled() });
        });
};  // return { enabled: false }

wsApis.gadRead = function (args, callback) {        // { id:Number, attrName:String }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1 }, callback)) return;

    var gadRead = utils.obtainDriver(this, 'gad', 'read', callback),
        gad = gadRead ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadRead(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 371.42 }

wsApis.gadWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var gadWrite = utils.obtainDriver(this, 'gad', 'write', callback),
        gad = gadWrite ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadWrite(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: false }

wsApis.gadExec = function (args, callback) {        // { id:Number, attrName:String[, params:Any[]] }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1, params: 0 }, callback)) return;

    var gadExec = utils.obtainDriver(this, 'gad', 'exec', callback),
        gad = gadExec ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadExec(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.params || [] , function (err, result) {
            callback(err, err ? undefined : { result: result });
        });
};  // return { result: 'completed' }

wsApis.gadSetReportCfg = function (args, callback) {    // { id:Number, attrName:String, rptCfg:Object }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1, rptCfg: 1 }, callback)) return;

    var gadSetReportCfg = utils.obtainDriver(this, 'gad', 'setReportCfg', callback),
        gad = gadSetReportCfg ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadSetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.rptCfg, function (err) {
            callback(err, err ? undefined : {});
        });
};  // return {}

wsApis.gadGetReportCfg = function (args, callback) {    // { id:Number, attrName:String }
    if (!utils.passWsArgsCheck(args, { id: 1, attrName: 1 }, callback)) return;

    var gadGetReportCfg = utils.obtainDriver(this, 'gad', 'getReportCfg', callback),
        gad = gadGetReportCfg ? utils.obtainGadgetById(this, args.id, callback) : undefined;

    if (gad)
        gadGetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, cfg) {
            callback(err, err ? undefined : { cfg: cfg });
        });
};  // return { cfg: rptCfg }

wsApis.gadGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (!utils.passWsArgsCheck(args, { id: 1, propNames: 0 }, callback)) return;

    var gad = utils.obtainGadgetById(this, args.id, callback),
        props;

    if (gad) {
        try {
            props = gad.get('props', args.propNames);
            return utils.feedback(null, { props: props }, callback);
        } catch (e) {
            return utils.feedback(e, null, callback);
        }
    }
};  // return { props: { name: 'xxx' } }

wsApis.gadSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (!utils.passWsArgsCheck(args, { id: 1, props: 1 }, callback)) return;

    var gad = utils.obtainGadgetById(this, args.id, callback),
        props;

    if (gad) {
        try {
            gad.set('props', args.props);
            return utils.feedback(null, {}, callback);
        } catch (e) {
            return utils.feedback(e, null, callback);
        }
    }
};  // return {}

module.exports = wsApis;
