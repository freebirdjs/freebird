'use strict';

var util = require('util'),
    EventEmitter = require('events');

var _ = require('busyman'),
    Objectbox = require('objectbox');

var validate = require('./components/validate.js');

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(netcores, options) {
    // options: { maxDevNum: x, maxGadNum: y, dbPaths: { device, gadget } }
    var propUnwritable = { writable: false, enumerable: false, configurable: false };

    // var maxDevNum = opt.maxDevNum || 600,
    //     maxGadNum = opt.maxGadNum || (3 * maxDevNum),
    //     devDbPath = (opt.dbPaths ? opt.dbPaths.device : devboxPath) || devboxPath,
    //     gadDbPath = (opt.dbPaths ? opt.dbPaths.gadget : gadboxPath) || gadboxPath;

    // if (maxGadNum < maxDevNum)
    //     throw new Error('Max gadget number cannot be less than max device number.');

    // if (!(this instanceof Freebird))
    //     return new Freebird(opt);

    EventEmitter.call(this);

    // [TODO] validate netcore
    netcores = _.isArray(netcores) ? netcores : [ netcores ];

    _.forEach(netcores, function (nc) {
        validate.netcore(nc);
        nc._freebird = freebird;
    });

    this._apis = {};
    this._plugins = {};
    this._netcores = [];
    this._rpcServers = [];

    // Object.defineProperty(this, '_apis', _.assign({ value: {} }, propUnwritable));
    // Object.defineProperty(this, '_plugins', _.assign({ value: [] }, propUnwritable));
    // Object.defineProperty(this, '_netcores', _.assign({ value: netcores }, propUnwritable));
    // Object.defineProperty(this, '_rpcServers', _.assign({ value: [] }, propUnwritable));

    // default authenticate all clients, override at will
    this.authenticate = function (rpcClient, data, cb) {
        utils.feedbackNextTick(null, true, cb);
    };

    // default authorize all clients, override at will
    this.authorize = function (rpcClient, cb) {
        utils.feedbackNextTick(null, true, cb);
    };

    // Note:
    //  1. Don't bind driver
    //  2. bind apis
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Public Methods: Network Management                              ***/
/***********************************************************************/
Freebird.prototype.enable = function (callback) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        try {
            nc.enable();
            numOfNcs -= 1;
        } catch (e) {
            callback(e);
            cbCalled = true;
        }

        if (numOfNcs === 0 && !cbCalled)
            callback(null, netcores.length);
    });
};

Freebird.prototype.disable = function () {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        try {
            nc.disable();
            numOfNcs -= 1;
        } catch (e) {
            callback(e);
            cbCalled = true;
        }

        if (numOfNcs === 0 && !cbCalled)
            callback(null, netcores.length);
    });
};

Freebird.prototype.start = function (callback) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        nc.start(function (err) {
            numOfNcs -= 1;

            if (err) {
                callback(err);
                cbCalled = true;
            } else if (numOfNcs === 0 && !cbCalled) {
                callback(null, netcores.length);
            }
        });
    });
};

Freebird.prototype.stop = function (callback) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        nc.stop(function (err) {
            numOfNcs -= 1;

            if (err) {
                callback(err);
                cbCalled = true;
            } else if (numOfNcs === 0 && !cbCalled) {
                callback(null, netcores.length);
            }
        });
    });
};

Freebird.prototype.reset = function (mode, callback) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        nc.reset(mode, function (err) {
            numOfNcs -= 1;

            if (err) {
                callback(err);
                cbCalled = true;
            } else if (numOfNcs === 0 && !cbCalled) {
                callback(null, netcores.length);
            }
        });
    });
};

Freebird.prototype.permitJoin = function (duration, callback) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        nc.permitJoin(duration, function (err) {
            numOfNcs -= 1;

            if (err) {
                if (_.isFunction(callback))
                    callback(err);
                cbCalled = true;
            } else if (numOfNcs === 0 && !cbCalled) {
                if (_.isFunction(callback))
                    callback(null, netcores.length);
            }
        });
    });
};

Freebird.prototype.remove = function (ncName, permAddr, callback) {
    var netcore = this.findByNet('netcore', ncName);

    if (!netcore) {
        callback(new Error('netcore: ' + ncName + ' not found'));
        return;
    }

    netcore.remove(permAddr, callback);
};

Freebird.prototype.ban = function (ncName, permAddr, callback) {
    var netcore = this.findByNet('netcore', ncName);

    if (!netcore) {
        callback(new Error('netcore: ' + ncName + ' not found'));
        return;
    }

    netcore.ban(permAddr, callback);
};

Freebird.prototype.unban = function (ncName, permAddr, callback) {
    var netcore = this.findByNet('netcore', ncName);

    if (!netcore) {
        callback(new Error('netcore: ' + ncName + ' not found'));
        return;
    }

    netcore.unban(permAddr, callback);
};

Freebird.prototype.ping = function (ncName, permAddr, callback) {
    var netcore = this.findByNet('netcore', ncName);

    if (!netcore) {
        callback(new Error('netcore: ' + ncName + ' not found'));
        return;
    }

    netcore.ping(permAddr, callback);
};

Freebird.prototype.maintain = function () {
    // [TODO] Should implement in netcore
};

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
Freebird.prototype.findById = function (type, id) {
    // type = 'netcore', 'device', 'gagdet'
};

Freebird.prototype.findByNet = function (type, ncName, permAddr, auxId) {
    // type = 'netcore', 'device', 'gagdet'
};

/***********************************************************************/
/*** Public Methods: Transportation                                  ***/
/***********************************************************************/
Freebird.prototype.addRpcServer = function (name) {};
Freebird.prototype.removeRpcServer = function (name) {};
Freebird.prototype.findRpcServer = function (name) {};


/***********************************************************************/
/*** Public Methods: Device and Gadget Registeration                 ***/
/***********************************************************************/
// Protected Methods for device and gadget registration
Freebird.prototype.register = function (type, obj, callback) {
    var regFn;

    switch (type) {
        case 'dev':
        case 'device':
            regFn = this.registerDevice;
            break;
        case 'gad':
        case 'gadget':
            regFn = this.registerDevice;
            break;
        default:
            process.nextTick(function () {
                callback(new TypeError('Unkown type: ' + type + ' to register with'));
            });
            break;
    }

    if (regFn)
        return regFn(obj, callback);
    else
        return this;
};

Freebird.prototype.unregister = function (type, obj, callback) {

};

Freebird.prototype._registerDevice = function (dev, callback) {
    validate.device(dev);

    var devId = dev.get('id'),
        oldDev = _.isNil(devId) ? undefined : this.find('device', devId);

    if (oldDev)
        return utils.feedback(new Error('dev exists, unregister it first.'), null, callback);

    if (dev._recovered) {   // recovered from database (when at booting up or restarting statge)
        this._devbox.set(devId, dev, function (err, id) {
            if (!err) {
                dev._recovered = false;
                delete dev._recovered;
            }
            callback(err, id);
        });
    } else {
        dev._poke();
        dev.set('net', {
            joinTime: utils.nowSeconds()
        });

        this._devbox.add(dev, function (err, id) {
            if (!err)
                dev._setId(id); // set id to dev, registered successfully

            callback(err, id);
        });
    }

    return this;
};

Freebird.prototype._unregisterDevice= function (dev, callback) {
    dev = registry._devInstance(dev);
    validate.device(dev);

    this._devbox.remove(dev.get('id'), function (err) {
        // unregister gadgets - 'gadLeaving' will be emitted@'devLeaving' handler
        // let gadLeaving handler do the unregistration
        callback(err);
    });

    return this;
};

Freebird.prototype._tweet = function (evt, msg) {
    var self = this,
        rpcServers = this._rpcServers,
        rpcServLen = rpcServers.length;

    if (_.isObject(msg.netcore))
        msg.netcore = msg.netcore.getName();

    setImmediate(this.emit, evt, msg);

    // pass event to rpc servers
    if (this._wsServer) {
        try {
            this._wsServer.receiveFreebirdEvent(evt, wsMsg);
        } catch (e) {
            // console.log(e); // log: handler not found
        }
    }
};
