'use strict';
// [TODO] reset, maintain

var _ = require('busyman');
var utils = require('../utils/utils');
var apis = {};

/**********************************************************************************/
/*** APIs for Remote Access                                                     ***/
/**********************************************************************************/
// ok
apis.getAllDevIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;

    if (_.isNil(args.ncName))
        return setImmediate(callback, null, { ids: this._devbox.exportAllIds() });
    else if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string if given'));
    else
        nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore ' + args.ncName + ' not found'));

    ids = this._devbox.filter(function (dev) {
        return dev.get('netcore') === nc;
    }).map(function (dev) {
        return dev.get('id');
    });

    return setImmediate(callback, null, { id: 0, ids: ids });
};  // return { ids: [ 1, 2, 3, 8, 12 ] } + id: 0

// ok
apis.getAllGadIds = function (args, callback) {   // { [ncName:String] }
    var nc, ids;

    if (_.isNil(args.ncName))
        return setImmediate(callback, null, { ids: this._gadbox.exportAllIds() });
    else if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string if given'));
    else
        nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore ' + args.ncName + ' not found'));

    ids = this._gadbox.filter(function (gad) {
        return gad.get('netcore') === nc;
    }).map(function (gad) {
        return gad.get('id');
    });

    return setImmediate(callback, null, { id: 0, ids: ids });
};  // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] } + id: 0

// ok
apis.getDevs = function (args, callback) {        // { ids:Number[] }
    var self = this,
        devs,
        cbCalled = false;

    if (!_.isArray(args.ids))
        return setImmediate(callback, new Error('ids should be an array'));

    _.forEach(args.ids, function (id) {
        if (!_.isNumber(id) && !_.isString(id)) {
            cbCalled = true;
            process.nextTick(callback, new TypeError('id must be a number or a string'));
            return false;
        }
    });

    if (cbCalled)
        return;

    devs = (args.ids).map(function (id) {
        var dev = self.findById('device', id);
        return dev ? utils.dumpDeviceInfo(dev) : undefined;
    });

    return setImmediate(callback, null, { id: 0, devs: devs });
};  // return { devs: [ devInfo, ... ] } + id: 0

// ok
apis.getGads = function (args, callback) {        // { ids:Number[] }
    var self = this,
        gads,
        cbCalled = false;

    if (!_.isArray(args.ids))
        return setImmediate(callback, new Error('ids should be an array'));

    _.forEach(args.ids, function (id) {
        if (!_.isNumber(id) && !_.isString(id)) {
            cbCalled = true;
            process.nextTick(callback, new TypeError('id must be a number or a string'));
            return false;
        }
    });

    if (cbCalled)
        return;

    gads = (args.ids).map(function (id) {
        var gad = self.findById('gadget', id);
        return gad ? utils.dumpGadgetInfo(gad) : undefined;
    });

    return setImmediate(callback, null, { id: 0, gads: gads });
};  // return { gads: [ gadInfo , ... ] } + id: 0

// ok
apis.getNetcores = function (args, callback) {    // { [ncNames:String[]] }
    var self = this,
        ncNames, ncs;

    if (_.has(args, 'ncNames')) {
        if (!_.isArray(args.ncNames))
            return setImmediate(callback, new Error('ncNames should be an array of strings'));

        _.forEach(args.ncNames, function (name) {
            if (!_.isString(name)) {
                cbCalled = true;
                process.nextTick(callback, new TypeError('ncName must be a string'));
                return false;
            }
        });
    }

    if (cbCalled)
        return;

    ncNames = args.ncNames ? args.ncNames : this._netcores.map(function (nc) {
        return nc.getName();
    });

    ncs = ncNames.map(function (name) {
        var nc = self.findByNet('netcore', name);
        return nc ? utils.dumpNetcoreInfo(nc) : undefined;
    });

    return setImmediate(callback, null, { id: 0, netcores: ncs });

};  // return { netcores: [ ncInfo, ... ] } + id: 0

apis.getBlacklist = function (args, callback) {   // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    nc = this.find('netcore', args.ncName);
    if (!utils.hasCalledWithNotFoundError('netcore', nc, callback))
        return setImmediate(callback, null, { id: 0, list: nc.getBlacklist() });
};  // return { list: [ '0x00124b0001ce4b89', ... ] } + id: 0

apis.permitJoin = function (args, callback) {     // { ncName:String, duration:Number }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, duration: 1 }, callback)) return;

    var permitJoin = this.find('driver', 'net', 'permitJoin');

    if (!utils.hasCalledWithNoDriverError(permitJoin, callback))
        permitJoin(args.ncName, args.duration, function (err, timeLeft) {
            callback(err, err ? undefined : { id: 0 });
        });
};  // return {} + id: 0

apis.reset = function (args, callback) {          // { ncName:String, mode:Number } => [TODO] mode
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var HARD_RESET = 1,
        reset = this.find('driver', 'net', 'reset');

    if (!utils.hasCalledWithNoDriverError(reset, callback))
        reset(args.ncName, HARD_RESET, function (err) { 
            callback(err, err ? undefined : { id: 0 });
        }); // [TODO] accept mode?
};  // return {} + id: 0

apis.enable = function (args, callback) {         // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var enable = this.find('driver', 'net', 'enable');

    if (!utils.hasCalledWithNoDriverError(enable, callback))
        enable(args.ncName, function (err) { 
            callback(err, err ? undefined : { id: 0 });
        });
};  // return {} + id: 0

apis.disable = function (args, callback) {        // { ncName:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1 }, callback)) return;

    var disable = this.find('driver', 'net', 'disable');
    if (!utils.hasCalledWithNoDriverError(disable, callback))
        disable(args.ncName, function (err) { 
            callback(err, err ? undefined : { id: 0 });
        });
};  // return {} + id: 0

apis.ban = function (args, callback) {            // { ncName:String, permAddr:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var ban = this.find('driver', 'net', 'ban');
    if (!utils.hasCalledWithNoDriverError(ban, callback))
        ban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : { id: 0 });
        });
};  // return {} + id: 0

apis.unban = function (args, callback) {          // { ncName:String, permAddr:String }
    if (utils.hasCalledWithArgsTypeError(args, { ncName: 1, permAddr: 1 }, callback)) return;

    var unban = this.find('driver', 'net', 'unban');
    if (!utils.hasCalledWithNoDriverError(unban, callback))
        unban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, err ? undefined : { id: 0 });
        });
};  // return {} + id: 0

apis.remove = function (args, callback) {         // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var remove = this.find('driver', 'net', 'remove'),
        dev = remove ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(remove, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        remove(args.ncName, dev.get('permAddr'), function (err, permAddr) {
            callback(err, err ? undefined : { permAddr: permAddr });
        });
};  // return { id: 0, permAddr: '0x00124b0001ce4b89' } + id: 0

apis.ping = function (args, callback) {           // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var ping = this.find('driver', 'net', 'ping'),
        dev = ping ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(ping, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        ping(args.ncName, dev.get('permAddr'), function (err, time) {
            callback(err, err ? undefined : { id: 0, time: time });
        });
};  // return { time: 12 } + id: 0

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
                    callback(null, { id: 0 });
            });
        });
    }
};  // return {} + id: 0

apis.devEnable = function (args, callback) {      // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devEnable = this.find('driver', 'dev', 'enable'),
        dev = devEnable ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devEnable, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devEnable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { id: dev.get('id'), enabled: dev.isEnabled() });
        });
};  // return { enabled: true } + id: x

apis.devDisable = function (args, callback) {     // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devDisable = this.find('driver', 'dev', 'disable'),
        dev = devDisable ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devDisable, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devDisable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { id: dev.get('id'), enabled: dev.isEnabled() });
        });
};  // return { enabled: false } + id: x

apis.devRead = function (args, callback) {        // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var devRead = this.find('driver', 'dev', 'read'),
        dev = devRead ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devRead, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devRead(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { id: dev.get('id'), value: val });
        });
};  // return { value: 3 } + id: x

apis.devWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var devWrite = this.find('driver', 'dev', 'write'),
        dev = devWrite ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devWrite, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devWrite(dev.get('netcore').getName(), dev.get('permAddr'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { id: dev.get('id'), value: val });
        });
};  // return { value: 'kitchen' } + id: x

apis.devIdentify = function (args, callback) {    // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var devIdentify = this.find('driver', 'dev', 'identify'),
        dev = devIdentify ? this.find('device', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(devIdentify, callback) &&
        !utils.hasCalledWithNotFoundError('device', dev, callback))
        devIdentify(dev.get('netcore').getName(), dev.get('permAddr'), function (err) {
            callback(err, err ? undefined : { id: dev.get('id') });
        });
};  // return {} + id: x

apis.devGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, propNames: 0 }, callback)) return;

    var dev = this.find('device', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('device', dev, callback)) {
        try {
            props = dev.get('props', args.propNames);
            return utils.feedbackImmediate(null, { id: dev.get('id'), props: props }, callback);
        } catch (e) {
            return utils.feedbackNextTick(e, null, callback);
        }
    }
};  // return { props: { name: 'xxx', location: 'xxx' } } + id: x

apis.devSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, props: 1 }, callback)) return;

    var dev = this.find('device', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('device', dev, callback)) {
        try {
            dev.set('props', args.props);
            return setImmediate(callback, null, { id: dev.get('id') });
        } catch (e) {
            return setImmediate(callback, e);
        }
    }
};  // return {} + id: x

apis.gadEnable = function (args, callback) {      // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var gadEnable = this.find('driver', 'gad', 'enable'),
        gad = gadEnable ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadEnable, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadEnable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { id: gad.get('id'), enabled: gad.isEnabled() });
        });
};  // return { enabled: true } + id: x

//---------------
apis.gadDisable = function (args, callback) {     // { id:Number }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1 }, callback)) return;

    var gadDisable = this.find('driver', 'gad', 'disable'),
        gad = gadDisable ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadDisable, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadDisable(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), function (err) {
            callback(err, err ? undefined : { id: gad.get('id'), enabled: gad.isEnabled() });
        });
};  // return { enabled: false } + id: x

apis.gadRead = function (args, callback) {        // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var gadRead = this.find('driver', 'gad', 'read'),
        gad = gadRead ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadRead, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadRead(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, val) {
            callback(err, err ? undefined : { id: gad.get('id'), value: val });
        });
};  // return { value: 371.42 } + id: x

apis.gadWrite = function (args, callback) {       // { id:Number, attrName:String, value:Any }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, value: 1 }, callback)) return;

    var gadWrite = this.find('driver', 'gad', 'write'),
        gad = gadWrite ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadWrite, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadWrite(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.value, function (err, val) {
            callback(err, err ? undefined : { id: gad.get('id'), value: val });
        });
};  // return { value: false } + id: x

apis.gadExec = function (args, callback) {        // { id:Number, attrName:String[, params:Any[]] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, params: 0 }, callback)) return;

    var gadExec = this.find('driver', 'gad', 'exec'),
        gad = gadExec ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadExec, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadExec(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.params || [] , function (err, result) {
            callback(err, err ? undefined : { id: gad.get('id'), result: result });
        });
};  // return { result: 'completed' } + id: x

apis.gadSetReportCfg = function (args, callback) {    // { id:Number, attrName:String, rptCfg:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1, rptCfg: 1 }, callback)) return;

    var gadSetReportCfg = this.find('driver', 'gad', 'setReportCfg'),
        gad = gadSetReportCfg ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadSetReportCfg, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadSetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, args.rptCfg, function (err) {
            callback(err, err ? undefined : { id: gad.get('id') });
        });
};  // return {} + id: x

apis.gadGetReportCfg = function (args, callback) {    // { id:Number, attrName:String }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, attrName: 1 }, callback)) return;

    var gadGetReportCfg = this.find('driver', 'gad', 'getReportCfg'),
        gad = gadGetReportCfg ? this.find('gadget', args.id) : undefined;

    if (!utils.hasCalledWithNoDriverError(gadGetReportCfg, callback) &&
        !utils.hasCalledWithNotFoundError('gadget', gad, callback))
        gadGetReportCfg(gad.get('netcore').getName(), gad.get('permAddr'), gad.get('auxId'), args.attrName, function (err, cfg) {
            callback(err, err ? undefined : { id: gad.get('id'), cfg: cfg });
        });
};  // return { cfg: rptCfg } + id: x

apis.gadGetProps = function (args, callback) {    // { id:Number, propNames:String[] }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, propNames: 0 }, callback)) return;

    var gad = this.find('gadget', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('gad', gad, callback)) {
        try {
            props = gad.get('props', args.propNames);
            return setImmediate(callback, null, { id: gad.get('id'), props: props });
        } catch (e) {
            return setImmediate(callback, e);
        }
    }
};  // return { props: { name: 'xxx' } } + id: x

apis.gadSetProps = function (args, callback) {    // { id:Number, props:Object }
    if (utils.hasCalledWithArgsTypeError(args, { id: 1, props: 1 }, callback)) return;

    var gad = this.find('gadget', args.id),
        props;

    if (!utils.hasCalledWithNotFoundError('gad', gad, callback)) {
        try {
            gad.set('props', args.props);
            return setImmediate(callback, null, { id: gad.get('id') });
        } catch (e) {
            return setImmediate(callback, e);
        }
    }
};  // return {} + id: x

module.exports = apis;
