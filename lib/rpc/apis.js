'use strict';
// [TODO] reset, maintain
// [TODO] timeout status?
var _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var utils = require('../utils/utils');
var apis = {};

/**********************************************************************************/
/*** APIs for Remote Access                                                     ***/
/**********************************************************************************/
// ok
apis.getAllDevIds = function (args, callback) {   // args = { [ncName:String] }
    var nc, ids;

    if (_.isNil(args.ncName))
        return setImmediate(callback, null, { id: 0, ids: this._devbox.exportAllIds(), status: RPC.Status.Content });
    else if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string if given'), { id: 0, status: RPC.Status.BadRequest });
    else
        nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    ids = this._devbox.filter(function (dev) {
        return dev.get('netcore') === nc;
    }).map(function (dev) {
        return dev.get('id');
    });

    return setImmediate(callback, null, { id: 0, ids: ids, status: RPC.Status.Content });
};  // return { id: 0, ids: [ 1, 2, 3, 8, 12 ], status: 205 }

// ok
apis.getAllGadIds = function (args, callback) {   // args = { [ncName:String] }
    var nc, ids;

    if (_.isNil(args.ncName))
        return setImmediate(callback, null, { id: 0, ids: this._gadbox.exportAllIds(), status: RPC.Status.Content });
    else if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string if given'), { id: 0, status: RPC.Status.BadRequest });
    else
        nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore ' + args.ncName + ' not found'), { id: 0, status: RPC.Status.NotFound });

    ids = this._gadbox.filter(function (gad) {
        return gad.get('netcore') === nc;
    }).map(function (gad) {
        return gad.get('id');
    });

    return setImmediate(callback, null, { id: 0, ids: ids, status: RPC.Status.Content });
};  // return { id: 0, ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ], status: 205 }

// ok
apis.getDevs = function (args, callback) {        // args = { ids:Number[] }
    var self = this,
        devs,
        cbCalled = false;

    if (!_.isArray(args.ids))
        return setImmediate(callback, new TypeError('ids should be an array'), { id: 0, status: RPC.Status.BadRequest });

    _.forEach(args.ids, function (id) {
        if (!_.isNumber(id) && !_.isString(id)) {
            cbCalled = true;
            process.nextTick(callback, new TypeError('id must be a number or a string'), { id: 0, status: RPC.Status.BadRequest });
            return false;
        }
    });

    if (cbCalled)
        return;

    devs = (args.ids).map(function (id) {
        var dev = self.findById('device', id);
        return dev ? utils.dumpDeviceInfo(dev) : undefined;
    });

    return setImmediate(callback, null, { id: 0, devs: devs, status: RPC.Status.Content });
};  // return { id: 0, devs: [ devInfo, ... ], status: 205 }

// ok
apis.getGads = function (args, callback) {        // args = { ids:Number[] }
    var self = this,
        gads,
        cbCalled = false;

    if (!_.isArray(args.ids))
        return setImmediate(callback, new TypeError('ids should be an array'), { id: 0, status: RPC.Status.BadRequest });

    _.forEach(args.ids, function (id) {
        if (!_.isNumber(id) && !_.isString(id)) {
            cbCalled = true;
            process.nextTick(callback, new TypeError('id must be a number or a string'), { id: 0, status: RPC.Status.BadRequest });
            return false;
        }
    });

    if (cbCalled)
        return;

    gads = (args.ids).map(function (id) {
        var gad = self.findById('gadget', id);
        return gad ? utils.dumpGadgetInfo(gad) : undefined;
    });

    return setImmediate(callback, null, { id: 0, gads: gads, status: RPC.Status.Content });
};  // return { id: 0, gads: [ gadInfo , ... ], status: 205 }

// ok
apis.getNetcores = function (args, callback) {    // args = { [ncNames:String[]] }
    var self = this,
        ncNames, ncs;

    if (_.has(args, 'ncNames')) {
        if (!_.isArray(args.ncNames))
            return setImmediate(callback, new TypeError('ncNames should be an array of strings'), { id: 0, status: RPC.Status.BadRequest });

        _.forEach(args.ncNames, function (name) {
            if (!_.isString(name)) {
                cbCalled = true;
                process.nextTick(callback, new TypeError('ncName must be a string'), { id: 0, status: RPC.Status.BadRequest });
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

    return setImmediate(callback, null, { id: 0, netcores: ncs, status: RPC.Status.Content });

};  // return { id: 0, netcores: [ ncInfo, ... ], status: 205 }

// ok
apis.getBlacklist = function (args, callback) {   // args = { ncName:String }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);
    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    try {
        var blist = nc.getBlacklist();
        setImmediate(callback, null, { id: 0, list: blist, status: RPC.Status.Content });
    } catch (e) {
        setImmediate(callback, e, { id: 0, status: RPC.Status.InternalServerError });
    }
};  // return { id: 0, list: [ '0x00124b0001ce4b89', ... ], status }

// ok
apis.permitJoin = function (args, callback) {     // args = { ncName:String, duration:Number }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });
    else if (!_.isNumber(args.duration))
        return setImmediate(callback, new TypeError('duration should be a number'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);
    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.permitJoin(args.duration, function (err) { // [TODO] 2nd arg?
        if (err)
            setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

// ok
apis.reset = function (args, callback) {          // args = { ncName:String, mode:Number } => [TODO] mode
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });

    var HARD_RESET = 1,
        mode = _.isNil(args.mode) ? HARD_RESET : args.mode,
        nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.reset(mode, function (err) {
        if (err)
            setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: 0, permAddr: permAddr, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

// ok
apis.enable = function (args, callback) {         // args = { ncName:String }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);
    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    try {
        nc.enable();
        return setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: 0, status: RPC.Status.InternalServerError });
    }
};  // return { id: 0, status }

// ok
apis.disable = function (args, callback) {        // args = { ncName:String }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);
    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    try {
        nc.disable();
        return setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: 0, status: RPC.Status.InternalServerError });
    }
};  // return { id: 0, status }

// ok
apis.ban = function (args, callback) {            // args = { ncName:String, permAddr:String }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });
    else if (!_.isString(args.permAddr))
        return setImmediate(callback, new TypeError('permAddr should be a string'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);
    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.ban(args.permAddr, function (err, permAddr) {
        if (err)
            return setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            return setImmediate(callback, err, { id: 0, permAddr: permAddr, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

// ok
apis.unban = function (args, callback) {          // args = { ncName:String, permAddr:String }
    if (!_.isString(args.ncName))
        return setImmediate(callback, new TypeError('ncName should be a string'), { status: RPC.Status.BadRequest });
    else if (!_.isString(args.permAddr))
        return setImmediate(callback, new TypeError('permAddr should be a string'), { status: RPC.Status.BadRequest });

    var nc = this.findByNet('netcore', args.ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.unban(args.permAddr, function (err, permAddr) {
        if (err)
            return setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            return setImmediate(callback, err, { id: 0, permAddr: permAddr, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

// ok
apis.remove = function (args, callback) {         // args = { id:Number }
    if (!_.isNumber(args.id) && !_.isString(args.id))
        return setImmediate(callback, new TypeError('id should be a number or a string'), { status: RPC.Status.BadRequest });

    var dev = this.findById('device', args.id),
        nc;

    if (!dev)
        return setImmediate(callback, new Error('device not found'), { id: args.id, status: RPC.Status.NotFound });

    nc = dev.get('netcore');

    nc.remove(dev.get('permAddr'), function (err, permAddr) {
        if (err)
            return setImmediate(callback, err, { id: args.id, status: RPC.Status.InternalServerError });
        else
            return setImmediate(callback, err, { id: args.id, permAddr: permAddr, status: RPC.Status.Deleted });
    });
};  // return { id: 0, permAddr: '0x00124b0001ce4b89', status }

// [TODO] move to dev? or don't know how to deal with id
apis.ping = function (args, callback) {           // args = { id:Number }
    if (!_.isNumber(args.id) && !_.isString(args.id))
        return setImmediate(callback, new TypeError('id should be a number or a string'), { status: RPC.Status.BadRequest });

    var dev = this.findById('device', args.id);
    if (!dev)
        return setImmediate(callback, new Error('device not found'), { id: args.id, status: RPC.Status.NotFound });

    dev.ping(function (err, time) {
        if (err)
            return setImmediate(callback, err, { id: args.id, status: RPC.Status.InternalServerError });
        else
            return setImmediate(callback, null, { id: 0, time: time, status: RPC.Status.InternalServerError });
    });
};  // return { id, time: 12, status }

// [TODO] HOW TO MAINTAIN EVERY DEVICE?
apis.maintain = function (args, callback) {       // args = { ncName:String }
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

/*************************************************************************************************/
/*** Device APIs                                                                               ***/
/*************************************************************************************************/
apis.devEnable = function (args, callback) {      // args = { id:Number }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, enabled: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, enabled: null, status: RPC.Status.NotFound });

    try {
        dev.enable();
        return setImmediate(callback, null, { id: args.id, enabled: dev.isEnabled(), status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, enabled: null, status: RPC.Status.InternalServerError });
    }
};  // return { id, enabled: true, status }

apis.devDisable = function (args, callback) {     // args = { id:Number }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, enabled: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, enabled: null, status: RPC.Status.NotFound });

    try {
        dev.disable();
        return setImmediate(callback, null, { id: args.id, enabled: dev.isEnabled(), status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, enabled: null, status: RPC.Status.InternalServerError });
    }
};  // return { id, enabled: false, status }

apis.devRead = function (args, callback) {        // args = { id:Number, attrName:String }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, value: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, value: null, status: RPC.Status.NotFound });

    dev.read(args.attrName, function (err, val) {
        if (err)
            setImmediate(callback, err, { id: args.id, value: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, value: val, status: RPC.Status.Content });
    });
};  // return { id, value: 3, status }

apis.devWrite = function (args, callback) {       // args = { id:Number, attrName:String, value:Any }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, value: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, value: null, status: RPC.Status.NotFound });

    dev.write(args.attrName, args.value, function (err, val) {
        if (err)
            setImmediate(callback, err, { id: args.id, value: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, value: val, status: RPC.Status.Changed });
    });
};  // return { id, value: 'kitchen', status }

apis.devIdentify = function (args, callback) {    // args = { id:Number }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, status: RPC.Status.NotFound });

    dev.identify(function (err) {
        if (err)
            setImmediate(callback, err, { id: args.id, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, status: RPC.Status.Ok });
    });
};  // return { id, status }

apis.devGetProps = function (args, callback) {    // args = { id:Number, propNames:String[] }
    var dev, props, typeErr;

    if (typeErr = idTypeError(args.id) || propNamesTypeError(args.propNames))
        return setImmediate(callback, typeErr, { id: args.id, props: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, props: null, status: RPC.Status.NotFound });

    try {
        props = dev.get('props', args.propNames);
        return setImmediate(callback, null, { id: args.id, props: props, status: RPC.Status.Content });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, status: RPC.Status.InternalServerError });
    }
};  // return { id, props: { name: 'xxx', location: 'xxx' }, status }

apis.devSetProps = function (args, callback) {    // args = { id:Number, props:Object }
    var dev, typeErr;

    if (typeErr = idTypeError(args.id) || propsTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, status: RPC.Status.NotFound });

    try {
        dev.set('props', args.props);
        return setImmediate(callback, null, { id: args.id, status: RPC.Status.Changed });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, status: RPC.Status.InternalServerError });
    }
};  // return { id, status }

/*************************************************************************************************/
/*** Gadget APIs                                                                               ***/
/*************************************************************************************************/
apis.gadEnable = function (args, callback) {      // args = { id:Number }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, enabled: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, enabled: null, status: RPC.Status.NotFound });

    try {
        gad.enable();
        return setImmediate(callback, null, { id: args.id, enabled: gad.isEnabled(), status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, enabled: null, status: RPC.Status.InternalServerError });
    }
};  // return { id, enabled: true, status }

apis.gadDisable = function (args, callback) {     // args = { id:Number }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, enabled: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, enabled: null, status: RPC.Status.NotFound });

    try {
        gad.disable();
        return setImmediate(callback, null, { id: args.id, enabled: gad.isEnabled(), status: RPC.Status.Ok });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, enabled: null, status: RPC.Status.InternalServerError });
    }
};  // return { id, enabled: false, status }

apis.gadRead = function (args, callback) {        // args = { id:Number, attrName:String }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, value: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, value: null, status: RPC.Status.NotFound });

    gad.read(args.attrName, function (err, val) {
        if (err)
            setImmediate(callback, err, { id: args.id, value: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, value: val, status: RPC.Status.Content });
    });
};  // return { id, value: 371.42, status }

apis.gadWrite = function (args, callback) {       // args = { id:Number, attrName:String, value:Any }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, value: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, value: null, status: RPC.Status.NotFound });

    gad.write(args.attrName, args.value, function (err, val) {
        if (err)
            setImmediate(callback, err, { id: args.id, value: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, value: val, status: RPC.Status.Changed });
    });
};  // return { id, value: false, status }

apis.gadExec = function (args, callback) {        // args = { id:Number, attrName:String[, params:Any[]] }
    var gad, typeErr,
        params = args.params || [];

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName) || paramsTypeError(params))
        return setImmediate(callback, typeErr, { id: args.id, result: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, result: null, status: RPC.Status.NotFound });

    gad.exec(args.attrName, params, function (err, result) {
        if (err)
            setImmediate(callback, err, { id: args.id, result: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, result: result, status: RPC.Status.Ok });
    });
};  // return { id, result: 'completed', status }

apis.gadSetReportCfg = function (args, callback) {    // args = { id:Number, attrName:String, rptCfg:Object }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName) || rptCfgTypeError(args.rptCfg))
        return setImmediate(callback, typeErr, { id: args.id, result: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, status: RPC.Status.NotFound });

    gad.setReportCfg(args.attrName, args.rptCfg, function (err, result) {
        if (err)
            setImmediate(callback, err, { id: args.id, result: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, result: result, status: RPC.Status.Changed });
    });
};  // return { id, result, status } - FIX spec: result true/false

apis.gadGetReportCfg = function (args, callback) {    // args = { id:Number, attrName:String }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id) || attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, cfg: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, cfg: null, status: RPC.Status.NotFound });

    gad.getReportCfg(args.attrName, function (err, cfg) {
        if (err)
            setImmediate(callback, err, { id: args.id, cfg: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, cfg: cfg, status: RPC.Status.Content });
    });
};  // return { id, cfg: rptCfg, status }

apis.gadGetProps = function (args, callback) {    // args = { id:Number, [propNames:String[]] } - FIX: spec
    var gad, props, typeErr;

    if (typeErr = idTypeError(args.id) || propNamesTypeError(args.propNames))
        return setImmediate(callback, typeErr, { id: args.id, props: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, props: null, status: RPC.Status.NotFound });

    try {
        props = gad.get('props', args.propNames);
        return setImmediate(callback, null, { id: args.id, props: props, status: RPC.Status.Content });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, props: null, status: RPC.Status.InternalServerError });
    }
};  // return { id, props: { name: 'xxx' }, status }

apis.gadSetProps = function (args, callback) {    // args = { id:Number, props:Object }
    var gad, typeErr;

    if (typeErr = idTypeError(args.id) || propsTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, status: RPC.Status.NotFound });

    try {
        gad.set('props', args.props);
        return setImmediate(callback, null, { id: args.id, status: RPC.Status.Changed });
    } catch (e) {
        return setImmediate(callback, e, { id: args.id, status: RPC.Status.InternalServerError });
    }
};  // return { id, status }

function idTypeError(id) {
    return (_.isNumber(id) || _.isString(id)) ? undefined : new TypeError('id should be a number or a string');
}

function propsTypeError(props) {
    return _.isPlainObject(props) ? undefined : new TypeError('props should be an object');
}

function rptCfgTypeError(rptCfg) {
    return _.isPlainObject(rptCfg) ? undefined : new TypeError('rptCfg should be an object');
}

function propNamesTypeError(propNames) {
    if (!_.isNil(propNames)) {
        if(!_.isArray(propNames) || !_.every(propNames, _.isString))
            return new TypeError('propNames should be an array of string');
    } 
}

function attrNameTypeError(attrName) {
    return _.isString(attrName) ? undefined : new TypeError('attrName should be a string');
}

function paramsTypeError(params) {
    return _.isArray(params) ? undefined : new TypeError('params should be an array');
}

module.exports = apis;
