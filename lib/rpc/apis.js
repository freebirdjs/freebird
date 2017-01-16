'use strict';

var _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var utils = require('../utils/utils.js'),
    validate = require('../utils/validate.js');

var apis = {};

/**********************************************************************************/
/*** APIs for Remote Access: Must bind 'this' to freebird while calling         ***/
/**********************************************************************************/
apis.getAllDevIds = function (args, callback) {   // args = { [ncName:String] }
    var nc, ids,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, ids: null, status: RPC.Status.BadRequest });

    if (_.isNil(args.ncName))
        ids = this._devbox.exportAllIds();
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, ids: null, status: RPC.Status.NotFound });
    else
        ids = this._devbox.filter(function (dev) {
            return dev.get('netcore') === nc;
        }).map(function (dev) {
            return dev.get('id');
        });

    setImmediate(callback, null, { id: 0, ids: ids, status: RPC.Status.Content });
};  // return { id: 0, ids: [ 1, 2, 3, 8, 12 ], status: 205 }

apis.getAllGadIds = function (args, callback) {   // args = { [ncName:String] }
    var nc, ids,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, ids: null, status: RPC.Status.BadRequest });

    if (_.isNil(args.ncName))
        ids = this._gadbox.exportAllIds();
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, ids: null, status: RPC.Status.NotFound });
    else
        ids = this._gadbox.filter(function (gad) {
            return gad.get('netcore') === nc;
        }).map(function (gad) {
            return gad.get('id');
        });

    setImmediate(callback, null, { id: 0, ids: ids, status: RPC.Status.Content });
};  // return { id: 0, ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ], status: 205 }

apis.getDevs = function (args, callback) {        // args = { ids:Number[] }
    var devs, typeErr,
        self = this;

    if (typeErr = validate.idsTypeError(args.ids))
        return setImmediate(callback, typeErr, { id: 0, devs: null, status: RPC.Status.BadRequest });

    devs = (args.ids).map(function (id) {
        var dev = self.findById('device', id);
        return dev ? utils.dumpDeviceInfo(dev) : null;
    });

    return setImmediate(callback, null, { id: 0, devs: devs, status: RPC.Status.Content });
};  // return { id: 0, devs: [ devInfo, ... ], status: 205 }

apis.getGads = function (args, callback) {        // args = { ids:Number[] }
    var gads, typeErr,
        self = this;

    if (typeErr = validate.idsTypeError(args.ids))
        return setImmediate(callback, typeErr, { id: 0, gads: null, status: RPC.Status.BadRequest });

    gads = (args.ids).map(function (id) {
        var gad = self.findById('gadget', id);
        return gad ? utils.dumpGadgetInfo(gad) : null;
    });

    return setImmediate(callback, null, { id: 0, gads: gads, status: RPC.Status.Content });
};  // return { id: 0, gads: [ gadInfo , ... ], status: 205 }

apis.getNetcores = function (args, callback) {    // args = { [ncNames:String[]] }
    var netcores,
        self = this,
        ncNames = args.ncNames,
        typeErr = _.isNil(ncNames) ? undefined : validate.ncNamesTypeError(ncNames);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, netcores: null, status: RPC.Status.BadRequest });

    if (!ncNames)
        ncNames = this._netcores.map(function (nc) {
            return nc.getName();
        });

    netcores = ncNames.map(function (name) {
        var nc = self.findByNet('netcore', name);
        return nc ? utils.dumpNetcoreInfo(nc) : null;
    });

    setImmediate(callback, null, { id: 0, netcores: netcores, status: RPC.Status.Content });
};  // return { id: 0, netcores: [ ncInfo, ... ], status: 205 }

apis.getBlacklist = function (args, callback) {   // args = { ncName:String }
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(args.ncName))
        return setImmediate(callback, typeErr, { id: 0, list: null, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, list: null, status: RPC.Status.NotFound });

    try {
        var blist = nc.getBlacklist();
        return setImmediate(callback, null, { id: 0, list: blist, status: RPC.Status.Content });
    } catch (e) {
        return setImmediate(callback, e, { id: 0, list: null, status: RPC.Status.InternalServerError });
    }
};  // return { id: 0, list: [ '0x00124b0001ce4b89', ... ], status }

apis.permitJoin = function (args, callback) {     // args = { [ncName:String], duration:Number }
    var nc,
        ncNum,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr = typeErr || validate.durationTypeError(args.duration))
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });

    if (_.isString(args.ncName)) {
        if (!(nc = this.findByNet('netcore', args.ncName)))
            return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

        nc.permitJoin(args.duration, function (err) {
            if (err)
                setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
            else
                setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        });
    } else {
        this.permitJoin(args.duration, function (err) {
            if (err)
                setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
            else
                setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        });
    }
};  // return { id: 0, status }

apis.reset = function (args, callback) {          // args = { [ncName:String], mode:Number } => mode: 0(SOFT)/1(HARD)
    var nc, ncNum,
        typeErr = _.isNil(args.ncName) ? undefined : (validate.ncNameTypeError(args.ncName) || validate.modeTypeError(args.mode));

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });

    if (_.isString(args.ncName)) {
        if (!(nc = this.findByNet('netcore', args.ncName)))
            return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

        nc.reset(args.mode, function (err) {
            if (err)
                setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
            else
                setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        });
    } else {
        this.reset(args.mode, function (err) {
            if (err)
                setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
            else
                setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        });
    }
};  // return { id: 0, status }

apis.enable = function (args, callback) {         // args = { [ncName:String] }
    var self = this,
        nc, ncNum,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });

    if (_.isString(args.ncName)) {
        if (!(nc = this.findByNet('netcore', args.ncName)))
            return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

        try {
            nc.enable();
            return setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        } catch (e) {
            return setImmediate(callback, null, { id: 0, status: RPC.Status.InternalServerError });
        }
    } else {
        ncNum = this._netcores.length;
        _.forEach(this._netcores, function (netcore) {
            try {
                netcore.enable();
            } catch (e) {
                self._fire('warn', e);
            } finally {
                ncNum -= 1;
                if (ncNum === 0)
                    setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
            }
        });
    }
};  // return { id: 0, status }

apis.disable = function (args, callback) {        // args = { [ncName:String] }
    var self = this,
        nc, ncNum,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });

    if (_.isString(args.ncName)) {
        if (!(nc = this.findByNet('netcore', args.ncName)))
            return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

        try {
            nc.disable();
            return setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
        } catch (e) {
            return setImmediate(callback, null, { id: 0, status: RPC.Status.InternalServerError });
        }
    } else {
        ncNum = this._netcores.length;
        _.forEach(this._netcores, function (netcore) {
            try {
                netcore.disable();
            } catch (e) {
                self._fire('warn', e);
            } finally {
                ncNum -= 1;
                if (ncNum === 0)
                    setImmediate(callback, null, { id: 0, status: RPC.Status.Ok });
            }
        });
    }
};  // return { id: 0, status }

apis.ban = function (args, callback) {            // args = { ncName:String, permAddr:String }
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(args.ncName) || validate.permAddrTypeError(args.permAddr))
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.ban(args.permAddr, function (err, permAddr) {
        if (err)
            setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, err, { id: 0, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

apis.unban = function (args, callback) {          // args = { ncName:String, permAddr:String }
    var nc, typeErr;

    if (typeErr = validate.ncNameTypeError(args.ncName) || validate.permAddrTypeError(args.permAddr))
        return setImmediate(callback, typeErr, { id: 0, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, status: RPC.Status.NotFound });

    nc.unban(args.permAddr, function (err, permAddr) {
        if (err)
            setImmediate(callback, err, { id: 0, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: 0, permAddr: permAddr, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

apis.remove = function (args, callback) {         // args = { ncName, permAddr }
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(args.ncName) || validate.permAddrTypeError(args.permAddr))
        return setImmediate(callback, typeErr, { id: 0, permAddr: null, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, permAddr: null, status: RPC.Status.NotFound });
    else if (!(dev = this.findByNet('device', args.ncName, args.permAddr)))
        return setImmediate(callback, new Error('device not found'), { id: 0, permAddr: null, status: RPC.Status.NotFound });

    nc.remove(args.permAddr, function (err, permAddr) {
        if (err)
            setImmediate(callback, err, { id: 0, permAddr: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: 0, permAddr: permAddr, status: RPC.Status.Deleted });
    });
};  // return { id: 0, permAddr: '0x00124b0001ce4b89', status }

apis.ping = function (args, callback) {
    var nc, dev, typeErr;

    if (typeErr = validate.ncNameTypeError(args.ncName) || validate.permAddrTypeError(args.permAddr))
        return setImmediate(callback, typeErr, { id: 0, time: null, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: 0, time: null, status: RPC.Status.NotFound });
    else if (!(dev = this.findByNet('device', args.ncName, args.permAddr)))
        return setImmediate(callback, new Error('device not found'), { id: 0, time: null, status: RPC.Status.NotFound });

    dev.ping(function (err, time) {
        if (err)
            setImmediate(callback, err, { id: 0, time: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: 0, time: time, status: RPC.Status.Content });
    });
};  // return { id, time: 12, status }

apis.maintain = function (args, callback) {       // args = { [ncName:String] }
    var nc,
        typeErr = _.isNil(args.ncName) ? undefined : validate.ncNameTypeError(args.ncName);

    if (typeErr)
        return setImmediate(callback, typeErr, { id: args.id, status: RPC.Status.BadRequest });
    else if (!(nc = this.findByNet('netcore', args.ncName)))
        return setImmediate(callback, new Error('netcore not found'), { id: args.id, status: RPC.Status.NotFound });

    this.maintain(args.ncName, function (err) {
        if (err)
            setImmediate(callback, null, { id: args.id, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, status: RPC.Status.Ok });
    });
};  // return { id: 0, status }

/*************************************************************************************************/
/*** Device APIs                                                                               ***/
/*************************************************************************************************/
apis.devEnable = function (args, callback) {      // args = { id:Number }
    var dev, typeErr;

    if (typeErr = validate.idTypeError(args.id))
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

    if (typeErr = validate.idTypeError(args.id))
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

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName))
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

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName))
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

    if (typeErr = validate.idTypeError(args.id))
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

apis.devPing = function (args, callback) {      // args = { id:Number }
    var dev, typeErr;

    if (typeErr = validate.idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, time: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, time: null, status: RPC.Status.NotFound });

    dev.ping(function (err, time) {
        if (err)
            setImmediate(callback, err, { id: args.id, time: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, time: time, status: RPC.Status.Content });
    });
};  // return { id, time: 12, status }

apis.devRemove = function (args, callback) {      // args = { id:Number }
    var nc, dev, typeErr;

    if (typeErr = validate.idTypeError(args.id))
        return setImmediate(callback, typeErr, { id: args.id, permAddr: null, status: RPC.Status.BadRequest });
    else if (!(dev = this.findById('device', args.id)))
        return setImmediate(callback, new Error('device not found'), { id: args.id, permAddr: null, status: RPC.Status.NotFound });
    else if (!(nc = dev.get('netcore')))
        return setImmediate(callback, new Error('netcore not found'), { id: args.id, permAddr: null, status: RPC.Status.NotFound });

    nc.remove(dev.get('permAddr'), function (err, permAddr) {
        if (err)
            setImmediate(callback, err, { id: args.id, permAddr: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, permAddr: permAddr, status: RPC.Status.Deleted });
    });
};

apis.devGetProps = function (args, callback) {    // args = { id:Number, [propNames:String[]] }
    var dev, props, typeErr;

    if (typeErr = validate.idTypeError(args.id) || validate.propNamesTypeError(args.propNames))
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

    if (typeErr = validate.idTypeError(args.id) || validate.propsTypeError(args.id))
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

    if (typeErr = validate.idTypeError(args.id))
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

    if (typeErr = validate.idTypeError(args.id))
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

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName))
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

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName))
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

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName) || validate.paramsTypeError(params))
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

apis.gadWriteReportCfg = function (args, callback) {    // args = { id:Number, attrName:String, rptCfg:Object }
    var gad, typeErr;

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName) || validate.rptCfgTypeError(args.rptCfg))
        return setImmediate(callback, typeErr, { id: args.id, result: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, status: RPC.Status.NotFound });

    gad.writeReportCfg(args.attrName, args.rptCfg, function (err, result) {
        if (err)
            setImmediate(callback, err, { id: args.id, result: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, result: result, status: RPC.Status.Changed });
    });
};  // return { id, status }

apis.gadReadReportCfg = function (args, callback) {    // args = { id:Number, attrName:String }
    var gad, typeErr;

    if (typeErr = validate.idTypeError(args.id) || validate.attrNameTypeError(args.attrName))
        return setImmediate(callback, typeErr, { id: args.id, cfg: null, status: RPC.Status.BadRequest });
    else if (!(gad = this.findById('gadget', args.id)))
        return setImmediate(callback, new Error('gadget not found'), { id: args.id, cfg: null, status: RPC.Status.NotFound });

    gad.readReportCfg(args.attrName, function (err, cfg) {
        if (err)
            setImmediate(callback, err, { id: args.id, cfg: null, status: RPC.Status.InternalServerError });
        else
            setImmediate(callback, null, { id: args.id, cfg: cfg, status: RPC.Status.Content });
    });
};  // return { id, cfg: rptCfg, status }

apis.gadGetProps = function (args, callback) {    // args = { id:Number, [propNames:String[]] }
    var gad, props, typeErr;

    if (typeErr = validate.idTypeError(args.id) || validate.propNamesTypeError(args.propNames))
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

    if (typeErr = validate.idTypeError(args.id) || validate.propsTypeError(args.id))
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

module.exports = apis;
