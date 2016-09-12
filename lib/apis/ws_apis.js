'use strict';

var _ = require('busyman');
var wsApis = {};
var netApiNames = [
        'getAllDevIds', 'getAllGadIds', 'getDevs', 'getGads', 'getNetcores', 'getBlacklist', 'permitJoin', 'maintain', 
        'reset', 'enable', 'disable', 'ban', 'unban', 'remove', 'ping' ],
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

/***********************************************************************/
/*** APIs for web client (websocket)                                 ***/
/***********************************************************************/
wsApis.getAllDevIds = function (args, callback) { // [ncName]
    var nc,
        devIds;

    if (!args.ncName) {
        devIds = this._devbox.exportAllIds();
        process.nextTick(function () {
            callback(null, { ids: devIds });
        });
    } else {
        nc = this.getNetcore(args.ncName);

        if (!nc) {
            callback(new Error('netcore not found.'));
        } else {
            devIds = this._devbox.filter('_netcore', nc).map(function (dev) {
                return dev.get('id');
            });
            callback(null, { ids: devIds });
        }
    }
};  // return { ids: [ 1, 2, 3, 8, 12 ] }

wsApis.getAllGadIds = function (args, callback) { // [ncName]
    var nc,
        gadIds;

    if (!args.ncName) {
        gadIds = this._gadbox.exportAllIds();
        callback(null, { ids: gadIds });
    } else {
        nc = this.getNetcore(args.ncName);
        if (!nc) {
            callback(new Error('netcore not found.'));
        } else {
            gadIds = this._gadbox.filter('_dev._netcore', nc).map(function (gad) {
                return gad.get('id');
            });

            callback(null, { ids: gadIds });
        }
    }
};  // return { ids: [ 2, 3, 5, 11, 12, 13, 14, 15 ] }

wsApis.getDevs = function (args, callback) {
    var fb = this,
        ids = args.ids,
        devs;

    if (!isArray(ids)) {
        callback(new Error('ids should be an array'));
    } else {
        devs = ids.map(function (id) {
            var dev = fb.find('device', id);
            return dev ?  dev._dumpDevInfo() : undefined;
        });

        callback(null, { devs: devs });
    }
};  // return { devs: [ devInfo, ... ] }

wsApis.getGads = function (args, callback) {
    var fb = this,
        ids = args.ids,
        gads;

    if (!isArray(ids)) {
        callback(new Error('ids should be an array'));
    } else {
        gads = ids.map(function (id) {
            var gad = fb.find('gadget', id);
            return gad ? gad._dumpGadInfo() : undefined;
        });

        callback(null, { gads: gads });
    }
};  // return { gads: [ gadInfo , ... ] }

wsApis.getNetcores = function (args, callback) {
    var fb = this,
        ncNames = args.ncNames,
        ncs;

    if (!ncNames || (isArray(ncNames) && ncNames.length === 0)) {
        ncNames = fb._netcores.map(function (nc) {
            return nc.getName();
        });
    }

    if (!isArray(ncNames)) {
        callback(new Error('ncNames should be an array'));
    } else {
        ncs = ncNames.map(function (name) {
            var nc = fb.find('netcore', name);
            return nc ? nc._dumpNcInfo() : undefined;
        });

        callback(null, { netcores: ncs });
    }
};  // return { netcores: [ ncInfo, ... ] }

wsApis.getBlacklist = function (args, callback) {
    var nc = this.find('netcore', args.ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else 
        callback(null, { list: nc.getBlacklist() });
};  // return { list: [ '0x00124b0001ce4b89', ... ] }


//--------------------------------------------------------------
wsApis.permitJoin = function (args, callback) {
    var permitJoin = this.find('driver', 'net', 'permitJoin');
    if (_.isFunction(permitJoin)) {
        permitJoin(args.ncName, args.duration, function (err, result) {
            callback(err, err ? undefined : {});
        });
    }
};  // return {}

wsApis.reset = function (args, callback) {
    var reset = this.find('driver', 'net', 'reset'),
        HARD_RESET = 1;

    if (_.isFunction(reset)) {
        reset(args.ncName, HARD_RESET, function (err) { 
            callback(err, err ? undefined : {});
        }); // [TODO] accept mode?
    }
};  // return {}

wsApis.enable = function (args, callback) {
    var enable = this.find('driver', 'net', 'enable'),
    if (_.isFunction(enable)) {
        enable(args.ncName, function (err) { 
            callback(err, {});
        });
    }
};  // return {}

wsApis.disable = function (args, callback) {
    var disable = this.find('driver', 'net', 'disable'),
    if (_.isFunction(disable)) {
        disable(args.ncName, function (err) { 
            callback(err, {});
        });
    }
};  // return {}

wsApis.ban = function (args, callback) {
    var ban = this.find('driver', 'net', 'ban');
    if (_.isFunction(ban)) {
        ban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, {});
        });
    }
};  // return {}

wsApis.unban = function (args, callback) {
    var unban = this.find('driver', 'net', 'unban');
    if (_.isFunction(unban)) {
        unban(args.ncName, args.permAddr, function (err, permAddr) {
            callback(err, {});
        });
    }
};  // return {}

wsApis.remove = function (args, callback) {
    var remove = this.find('driver', 'net', 'remove'),
        dev = this.find('device', args.id);

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('dev not found.'));
        });
    } else if (_.isFunction(remove)) {
        remove(args.ncName, dev.get('permAddr'), function (err, permAddr) {
            callback(err, permAddr ? { permAddr: permAddr } : undefined);
        });
    }
};  // return { permAddr: '0x00124b0001ce4b89' }

wsApis.ping = function (args, callback) {
    var ping = this.find('driver', 'net', 'ping'),
        dev = this.find('device', args.id);

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('dev not found.'));
        });
    } else if (_.isFunction(ping)) {
        ping(args.ncName, dev.get('permAddr'), function (err, time) {
            callback(err, err ? undefined : { time: time });
        });
    }
};  // return { time: 12 }

wsApis.maintain = function (args, callback) { //ncName
    var maintain = this.find('driver', 'net', 'maintain');

    // [TODO]
};  // return {}

wsApis.devEnable = function (args, callback) {
    var enable = this.find('driver', 'dev', 'enable'),
        dev = this.find('device', args.id);

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('dev not found.'));
        });
    } else if (_.isFunction(enable)) {
        enable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { value: dev.isEnabled() });
        });
    }
};  // return { value: true }

wsApis.devDisable = function (args, callback) {
    var disable = this.find('driver', 'dev', 'disable'),
        dev = this.find('device', args.id);

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('dev not found.'));
        });
    } else if (_.isFunction(disable)) {
        disable(dev.get('netcore').getName(), dev.get('permAddr'), function (err, isEnabled) {
            callback(err, err ? undefined : { value: dev.isEnabled() });
        });
    }
};  // return { value: false }

wsApis.devGetProps = function (args, callback) {
    var dev = this.find('device', args.id),
        err,
        result;

    if (!dev) {
        process.nextTick(function () {
            callback(new Error('dev not found.'));
        });
    } else {
        try {
            result = dev.get('props', args.propNames);
        } catch (e) {
            err = e;
        } finally {
            process.nextTick(function () {
                callback(err, err ? undefined : { props: result });
            });
        }
    }
};

//------------------------------------------------
wsApis.devSetProps = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.setProps(args.props);
            callback(null, {});
        } catch (e) {
            callback(e);
        }
    }
};

wsApis.devRead = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        dev.read(args.attrName, function (err, val) {
            if (err)
                callback(err);
            else
                callback(null, { value: val });
        });
    }
};  // return { value: 3 }

wsApis.devWrite = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        dev.write(args.attrName, args.value, function (err, val) {
            if (err)
                callback(err);
            else
                callback(null, { value: val });
        });
    }
};  // return { value: 'kitchen' }

wsApis.devIdentify= function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        dev.identify(function (err, result) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.gadGetProps = function (args, callback) {
    var gad = this.findGadById(args.id),
        result;

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            result = gad.getProps(args.propNames);
            callback(null, { props: result });
        } catch (e) {
            callback(e);
        }
    }
};

wsApis.gadSetProps = function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            gad.setProps(args.props);
            callback(null, {});
        } catch (e) {
            callback(e);
        }
    }
};

wsApis.gadRead= function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        gad.read(args.attrName, function (err, val) {
            console.log(err);
            if (err)
                callback(err);
            else
                callback(null, { value: val });
        });
    }
};  // return { value: 371.42 }

wsApis.gadWrite= function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        gad.write(args.attrName, args.value, function (err, val) {
            if (err)
                callback(err);
            else
                callback(null, { value: val });
        });
    }
};  // return { value: false }

wsApis.gadExec= function (args, callback) {    // [TODO] args is optional
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        gad.exec(args.attrName, args.params, function (err, val) {
            if (err)
                callback(err);
            else
                callback(null, { result: val });
        });
    }
};  // return { result: 'completed' }

wsApis.gadSetReportCfg= function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        gad.setReportCfg(args.attrName, args.rptCfg, function (err, val) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.gadGetReportCfg = function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        gad.getReportCfg(args.attrName, function (err, rptCfg) {
            if (err)
                callback(err);
            else
                callback(null, { cfg: rptCfg });
        });
    }
};  // return { cfg: rptCfg }

wsApis.gadEnable= function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            gad.enable();
            callback(null, { enabled: gad.isEnabled() });
        } catch (e) {
            callback(e);
        }
    }
};  // return { value: true }

wsApis.gadDisable= function (args, callback) {
    var gad = this.findGadById(args.id);

    if (!gad) {
        callback(new Error('gad not found.'));
    } else {
        try {
            gad.disable();
            callback(null, { enabled: gad.isEnabled() });
        } catch (e) {
            callback(e);
        }
    }


};  // return { value: false }

/***********************************************************************/
/*** Private: helper                                                 ***/
/***********************************************************************/
function isFunction(fn) {
    return (typeof fn === 'function');
}

function isArray(arr) {
    return Array.isArray(arr);
}

module.exports = wsApis;
