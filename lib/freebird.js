'use strict';

var util = require('util'),
    EventEmitter = require('events');

var _ = require('busyman'),
    Objectbox = require('objectbox');

var registry = require('./components/registry.js');

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

    // _devbox
    // _gadbox

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
/*** Public Methods: Device and Gadget Registeration                 ***/
/***********************************************************************/
// Protected Methods for device and gadget registration
Freebird.prototype.register = registry.register;
Freebird.prototype.unregister = registry.unregister;

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
Freebird.prototype.findById = function (type, id) {
    // type = 'netcore', 'device', 'gagdet'
    if (type === 'netcore')
        return _.find(this._netcores, function (nc) {
            return nc.getName() === id;
        });
    else if (type === 'device')
        return this._devbox.get(id);
    else if (type === 'gadget')
        return this._gadbox.get(id);
    else
        throw new TypeError('Unknow type: ' + type + ' to find for');
};

Freebird.prototype.findByNet = function (type, ncName, permAddr, auxId) {
    // type = 'netcore', 'device', 'gagdet'
    if (type === 'netcore') {
        return _.find(this._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    } else if (type === 'device') {
        return this._devbox.find(function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
    } else if (type === 'gadget') {
        return this._gadbox.find(function (gad) {
            return (gad.get('permAddr') === permAddr) && (gad.get('auxId') === auxId) && (gad.get('netcore').getName() === ncName);
        });
    } else {
        throw new TypeError('Unknow type: ' + type + ' to find for');
    }
};

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
/*** Public Methods: Transportation                                  ***/
/***********************************************************************/
Freebird.prototype.addRpcServer = function (name) {};
Freebird.prototype.removeRpcServer = function (name) {};
Freebird.prototype.findRpcServer = function (name) {};


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
