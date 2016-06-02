/* jshint node: true */
'use strict';

var wsApis = {};

wsApis.bindWsApis = function (fb) {
    fb._wsApis.net = {
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
    };

    fb._wsApis.dev = {
        read: wsApis.devRead.bind(fb),
        write: wsApis.devWrite.bind(fb),
        identify: wsApis.devIdentify.bind(fb),
        enable: wsApis.devEnable.bind(fb),
        disable: wsApis.devDisable.bind(fb),
        getProps: wsApis.devGetProps.bind(fb),
        setProps: wsApis.devSetProps.bind(fb)
    };

    fb._wsApis.gad = {
        read: wsApis.gadRead.bind(fb),
        write: wsApis.gadWrite.bind(fb),
        exec: wsApis.gadExec.bind(fb),
        setReportCfg: wsApis.gadSetReportCfg.bind(fb),
        getReportCfg: wsApis.gadGetReportCfg.bind(fb),
        enable: wsApis.gadEnable.bind(fb),
        disable: wsApis.gadDisable.bind(fb),
        getProps: wsApis.gadGetProps.bind(fb),
        setProps: wsApis.gadSetProps.bind(fb)
    };
};

/***********************************************************************/
/*** APIs for web client (websocket)                                 ***/
/***********************************************************************/
wsApis.getAllDevIds = function (args, callback) { // [ncName]
    var nc,
        devIds;

    if (!args.ncName) {
        devIds = this._devbox.exportAllIds();
        callback(null, { ids: devIds });
    } else {
        nc = this.getNetcore(args.ncName);

        if (!nc) {
            callback(new Error('netcore not found..'));
        } else {
            devIds = this._devbox.filter('_netcore', nc).map(function (dev) {
                return dev.getId();
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
            gadIds = this._gadbox.filter('_netcore', nc).map(function (gad) {
                return gad.getId();
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
            var dev = fb._devbox.get(id);
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
            var gad = fb._gadbox.get(id);
            return gad ? gad._dumpGadInfo() : undefined;
        });

        callback(null, { gads: gads });
    }
};  // return { gads: [ gadInfo , ... ] }

wsApis.getNetcores = function (args, callback) {
    var fb = this,
        ncNames = args.ncNames,
        ncs;

    if (!isArray(ncNames)) {
        callback(new Error('ncNames should be an array'));
    } else {
        ncs = ncNames.map(function (name) {
            var nc = fb.getNetcore(name);
            return nc ? nc._dumpNcInfo() : undefined;
        });

        callback(null, { netcores: ncs });
    }
};  // return { netcores: [ ncInfo, ... ] }

wsApis.getBlacklist = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc)
        callback(new Error('netcore not found.'));
    else 
        callback(null, { list: nc.getBlacklist() });
};  // return { list: [ '0x00124b0001ce4b89', ... ] }

wsApis.permitJoin = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        nc.permitJoin(args.duration, function (err, result) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.maintain = function (args, callback) { //ncName
    // [TODO] no driver?
    // return {}
};

wsApis.reset = function (args, callback) {
    var nc = this.getNetcore(args.ncName),
        HARD_RESET = 1;

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        nc.reset(HARD_RESET, function (err) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.enable = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        try {
            nc.enable();
            callback(null, {});
        } catch (err) {
            callback(err, {});
        }
    }
};  // return {}

wsApis.disable = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc) {
        return callback(new Error('netcore not found.'));
    } else {
        try {
            nc.disable();
            callback(null, {});
        } catch (err) {
            callback(err, {});
        }
    }
};  // return {}

wsApis.ban = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        nc.ban(args.permAddr, function (err, result) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.unban = function (args, callback) {
    var nc = this.getNetcore(args.ncName);

    if (!nc) {
        callback(new Error('netcore not found.'));
    } else {
        nc.unban(args.permAddr, function (err, result) {
            if (err)
                callback(err);
            else
                callback(null, {});
        });
    }
};  // return {}

wsApis.remove = function (args, callback) {
    var nc,
        dev = this.findDevById(args.id),
        permAddr = dev ? dev.getPermAddr() : undefined;

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        nc = dev.getNetcore();

        if (nc) {
            nc.remove(permAddr, function (err, perm) {
                if (err)
                    callback(err);
                else
                    callback(null, { permAddr: permAddr });
            });
        } else {
            callback(new Error('netcore not found.'));
        }

    }
};  // return { permAddr: '0x00124b0001ce4b89' }

wsApis.ping = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        dev.ping(function (err, time) {
            if (err)
                callback(err);
            else
                callback(null, { time: time });
        });
    }
};  // return { time: 12 }

wsApis.devEnable = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.enable();
            callback(null, { enabled: dev.isEnabled() });
        } catch (e) {
            callback(e);
        }
    }
};  // return { value: true }

wsApis.devDisable = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.disable();
            callback(null, { enabled: dev.isEnabled() });
        } catch (e) {
            callback(e);
        }
    }
};  // return { value: false }

wsApis.devGetProps = function (args, callback) {
    var dev = this.findDevById(args.id),
        result;

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            result = dev.getProps(args.propNames);
            callback(null, result);
        } catch (e) {
            callback(e);
        }
    }
};

wsApis.devSetProps = function (args, callback) {
    var dev = this.findDevById(args.id);

    if (!dev) {
        callback(new Error('dev not found.'));
    } else {
        try {
            dev.setProps(args.props);
            callback(null);
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
            callback(null, result);
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
            callback(null);
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
        gad.setReportCfg(args.attrName, args.cfg, function (err, val) {
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
