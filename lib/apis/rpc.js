'use strict';
// [TODO] reset, maintain

var _ = require('busyman');
var utils = require('../utils/utils');

var apis = {};
var netApiNames = [
        'getAllDevIds', 'getAllGadIds', 'getDevs', 'getGads', 'getNetcores', 'getBlacklist', 'permitJoin', 'maintain', 
        'reset', 'enable', 'disable', 'ban', 'unban', 'remove', 'ping'
    ],
    devApiNames = [ 'read', 'write', 'identify', 'enable', 'disable', 'getProps', 'setProps' ],
    gadApiNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable', 'getProps', 'setProps' ];


apis.bindRpcApis = function (freebird) {
    freebird._rpcApis = _.isObject(freebird._rpcApis) ? freebird._rpcApis : {};
    freebird._rpcApis.net = _.isObject(freebird._rpcApis.net) ? freebird._rpcApis.net : {};
    freebird._rpcApis.dev = _.isObject(freebird._rpcApis.dev) ? freebird._rpcApis.dev : {};
    freebird._rpcApis.gad = _.isObject(freebird._rpcApis.gad) ? freebird._rpcApis.gad : {};

    _.forEach(netApiNames, function (name) {
        freebird._rpcApis.net[name] = apis[name].bind(freebird);
    });

    _.forEach(devApiNames, function (name) {
        freebird._rpcApis.dev[name] = apis['dev' + _.upperFirst(name)].bind(freebird);
    });

    _.forEach(gadApiNames, function (name) {
        freebird._rpcApis.gad[name] = apis['gad' + _.upperFirst(name)].bind(freebird);
    });
};

/**********************************************************************************/
/*** APIs for web client (websocket) - Use Freebird Drivers to Accomplish Tasks ***/
/**********************************************************************************/
apis.getAllDevIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 0 }, callback)) return;
    if (_.isNil(args.ncName))
        return utils.feedbackImmediate(null, { ids: this._devbox.exportAllIds() }, callback);

    nc = this.find('netcore', args.ncName);
    if (utils.hasCalledWithNotFoundError('netcore', nc, callback)) return;

    ids = this._devbox.filter(function (dev) {
        return dev.get('netcore') === nc;
    }).map(function (dev) {
        return dev.get('id');
    });

    return utils.feedbackImmediate(null, { ids: ids }, callback);
};  // return { ids: [ 1, 2, 3, 8, 12 ] }

apis.getAllGadIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 0 }, callback)) return;
    if (_.isNil(args.ncName))
        return utils.feedbackImmediate(null, { ids: this._gadbox.exportAllIds() }, callback);

    nc = this.find('netcore', args.ncName);
    if (utils.hasCalledWithNotFoundError('netcore', nc, callback)) return;

    ids = this._gadbox.filter(function (gad) {
        return gad.get('netcore') === nc;
    }).map(function (gad) {
        return gad.get('id');
    });

    return utils.feedbackImmediate(null, { ids: ids }, callback);
};  // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] }

apis.getDevs = function (args, callback) {        // { ids:Number[] }
    if (utils.hasCalledWithArgsTypeError(args, { ids: 1 }, callback)) return;

    var self = this,
        devs = (args.ids).map(function (id) {
            var dev = self.find('device', id);
            return dev ?  dumpDevInfo(dev) : undefined;
        });

    return utils.feedbackImmediate(null, { devs: devs }, callback);
};  // return { devs: [ devInfo, ... ] }

apis.getGads = function (args, callback) {        // { ids:Number[] }
    if (utils.hasCalledWithArgsTypeError(args, { ids: 1 }, callback)) return;

    var self = this,
        gads = (args.ids).map(function (id) {
            var gad = self.find('gadget', id);
            return gad ? gad.dump() : undefined;
        });

    return utils.feedbackImmediate(null, { gads: gads }, callback);
};  // return { gads: [ gadInfo , ... ] }

apis.getNetcores = function (args, callback) {    // { [ncNames:String[]] }
    var self = this,
        ncNames, ncs;

    if (utils.hasCalledWithArgsTypeError(args, { ncNames: 0 }, callback)) return;

    ncNames = args.ncNames ? args.ncNames : this._netcores.map(function (nc) {
        return nc.getName();
    });

    ncs = ncNames.map(function (name) {
        var nc = self.find('netcore', name);
        return nc ? utils.dumpNetcoreInfo(nc) : undefined;
    });

    return utils.feedbackImmediate(null, { netcores: ncs }, callback);
};  // return { netcores: [ ncInfo, ... ] }

apis.getBlacklist = function (args, callback) {   // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    nc = this.find('netcore', args.ncName);
    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        utils.feedbackImmediate(null, { list: nc.getBlacklist() }, callback);
};  // return { list: [ '0x00124b0001ce4b89', ... ] }

apis.permitJoin = function (args, callback) {     // { ncName:String, duration:Number }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, duration: 1 }, callback)) return;

    var permitJoin = this.find('driver', 'net', 'permitJoin');

    if (!utils.hasCalledWithNoDriverError(permitJoin, callback))
        permitJoin(args.ncName, args.duration, function (err, timeLeft) {
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.reset = function (args, callback) {          // { ncName:String, mode:Number } => [TODO] mode
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var HARD_RESET = 1,
        reset = this.find('driver', 'net', 'reset');

    if (!utils.hasCalledWithNoDriverError(reset, callback))
        reset(args.ncName, HARD_RESET, function (err) { 
            callback(err, err ? undefined : {});
        }); // [TODO] accept mode?
};  // return {}

apis.enable = function (args, callback) {         // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var enable = this.find('driver', 'net', 'enable');

    if (!utils.hasCalledWithNoDriverError(enable, callback))
        enable(args.ncName, function (err) { 
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.disable = function (args, callback) {        // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var disable = this.find('driver', 'net', 'disable');
    if (!utils.hasCalledWithNoDriverError(disable, callback))
        disable(args.ncName, function (err) { 
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.ban = function (args, callback) {            // { ncName:String, permAddr:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var ban = this.find('driver', 'net', 'ban');
    if (!utils.hasCalledWithNoDriverError(ban, callback))
        ban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.unban = function (args, callback) {          // { ncName:String, permAddr:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var unban = this.find('driver', 'net', 'unban');
    if (!utils.hasCalledWithNoDriverError(unban, callback))
        unban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.remove = function (args, callback) {         // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var remove = this.find('driver', 'net', 'remove'),
        dev = remove ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(remove, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        remove(args.ncName, dev.get('permAddr'), function (err, permAddr) {
            callback(err, err ? undefined : { permAddr: permAddr });
        });
};  // return { permAddr: '0x00124b0001ce4b89' }

apis.ping = function (args, callback) {           // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var ping = this.find('driver', 'net', 'ping'),
        dev = ping ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(ping, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        ping(args.ncName, dev.get('permAddr'), function (err, time) {
            callback(err, err ? undefined : { time: time });
        });
};  // return { time: 12 }

// [TODO] HOW TO MAINTAIN EVERY DEVICE?
apis.maintain = function (args, callback) {       // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var maintain = this.find('driver', 'net', 'maintain'),
        nc = this.find('netcore', args, ncName),
        devs = nc ? this._devbox.filter(function (dev) { return dev.get('netcore') === nc; }) : undefined,
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

apis.devEnable = function (args, callback) {      // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devEnable = this.find('driver', 'dev', 'enable'),
        dev = devEnable ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devEnable, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devEnable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { enabled: dev.isEnabled() });
        });
};  // return { enabled: true }

apis.devDisable = function (args, callback) {     // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devDisable = this.find('driver', 'dev', 'disable'),
        dev = devDisable ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devDisable, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devDisable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { enabled: dev.isEnabled() });
        });
};  // return { enabled: false }

apis.devRead = function (args, callback) {        // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var devRead = this.find('driver', 'dev', 'read'),
        dev = devRead ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devRead, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devRead(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 3 }

apis.devWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var devWrite = this.find('driver', 'dev', 'write'),
        dev = devWrite ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devWrite, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devWrite(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 'kitchen' }

apis.devIdentify = function (args, callback) {    // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devIdentify = this.find('driver', 'dev', 'identify'),
        dev = devIdentify ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devIdentify, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devIdentify(dev.get('netcore').getName(), dev.get('permAddr'), function (err) {
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.devGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, propNames: 0 }, callback)) return;

    var dev = this.find('device', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('device', dev, callback)) {
        try {
            props = dev.get('props', args.propNames);
            return utils.feedbackImmediate(null, { props: props }, callback);
        } catch (e) {
            return utils.feedbackNextTick(e, null, callback);
        }
    }
};  // return { props: { name: 'xxx', location: 'xxx' } }

apis.devSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, props: 1 }, callback)) return;

    var dev = this.find('device', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('device', dev, callback)) {
        try {
            dev.set('props', args.props);
            return utils.feedbackImmediate(null, {}, callback);
        } catch (e) {
            return utils.feedbackNextTick(e, null, callback);
        }
    }
};  // return {}

apis.gadEnable = function (args, callback) {      // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var gadEnable = this.find('driver', 'gad', 'enable'),
        gad = gadEnable ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadEnable, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadEnable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { enabled: gad.isEnabled() });
        });
};  // return { enabled: true }

//---------------
apis.gadDisable = function (args, callback) {     // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var gadDisable = this.find('driver', 'gad', 'disable'),
        gad = gadDisable ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadDisable, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadDisable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { enabled: gad.isEnabled() });
        });
};  // return { enabled: false }

apis.gadRead = function (args, callback) {        // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var gadRead = this.find('driver', 'gad', 'read'),
        gad = gadRead ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadRead, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadRead(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: 371.42 }

apis.gadWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var gadWrite = this.find('driver', 'gad', 'write'),
        gad = gadWrite ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadWrite, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadWrite(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { value: val });
        });
};  // return { value: false }

apis.gadExec = function (args, callback) {        // { id:Number, attrName:String[, params:Any[]] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, params: 0 }, callback)) return;

    var gadExec = this.find('driver', 'gad', 'exec'),
        gad = gadExec ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadExec, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadExec(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.params || [] , function (err, result) {
            callback(err, err ? undefined : { result: result });
        });
};  // return { result: 'completed' }

apis.gadSetReportCfg = function (args, callback) {    // { id:Number, attrName:String, rptCfg:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, rptCfg: 1 }, callback)) return;

    var gadSetReportCfg = this.find('driver', 'gad', 'setReportCfg'),
        gad = gadSetReportCfg ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadSetReportCfg, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadSetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.rptCfg, function (err) {
            callback(err, err ? undefined : {});
        });
};  // return {}

apis.gadGetReportCfg = function (args, callback) {    // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var gadGetReportCfg = this.find('driver', 'gad', 'getReportCfg'),
        gad = gadGetReportCfg ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadGetReportCfg, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadGetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, cfg) {
            callback(err, err ? undefined : { cfg: cfg });
        });
};  // return { cfg: rptCfg }

apis.gadGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, propNames: 0 }, callback)) return;

    var gad = this.find('gadget', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('gad', gad, callback)) {
        try {
            props = gad.get('props', args.propNames);
            return utils.feedbackImmediate(null, { props: props }, callback);
        } catch (e) {
            return utils.feedbackNextTick(e, null, callback);
        }
    }
};  // return { props: { name: 'xxx' } }

apis.gadSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, props: 1 }, callback)) return;

    var gad = this.find('gadget', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('gad', gad, callback)) {
        try {
            gad.set('props', args.props);
            return utils.feedbackImmediate(null, {}, callback);
        } catch (e) {
            return utils.feedbackNextTick(e, null, callback);
        }
    }
};  // return {}

module.exports = apis;
