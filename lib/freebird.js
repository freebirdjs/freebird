'use strict';

var path = require('path'),
    util = require('util'),
    EventEmitter = require('events');

var _ = require('busyman'),
    Objectbox = require('objectbox');

var loader = require('./components/loader.js');
var registry = require('./components/registry.js');
var validate = require('./components/validate.js');

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(netcores, options) {
    // options: { maxDevNum: x, maxGadNum: y, dbPaths: { device, gadget } }
    if (!(this instanceof Freebird))
        return new Freebird(netcores, options);

    var self = this,
        devboxPath = path.resolve(__dirname, '../database/dev.db'),
        gadboxPath = path.resolve(__dirname, '../database/gad.db'),
        propWritable = { writable: false, enumerable: false, configurable: false },
        propUnwritable = { writable: false, enumerable: false, configurable: false };

    var maxDevNum = opt.maxDevNum || 200,
        maxGadNum = opt.maxGadNum || (3 * maxDevNum),
        devDbPath = (_.isObject(opt.dbPaths) ? opt.dbPaths.device : devboxPath) || devboxPath,
        gadDbPath = (_.isObject(opt.dbPaths) ? opt.dbPaths.gadget : gadboxPath) || gadboxPath;

    if (maxGadNum < maxDevNum)
        throw new Error('Max gadget number cannot be less than max device number');

    EventEmitter.call(this);

    netcores = _.isArray(netcores) ? netcores : [ netcores ];
    _.forEach(netcores, function (nc, i) {
        if (!validate.isNetcore(nc))
            throw new TypeError('Element of index ' + i + ' is not a valid netcore');
        else
            nc._freebird = self;
    });

    Object.defineProperty(this, '_netcores', _.assign({
        value: netcores
    }, propUnwritable));

    Object.defineProperty(this, '_devbox', _.assign({
        value: new Objectbox(devDbPath, maxDevNum)
    }, propWritable));

    Object.defineProperty(this, '_gadbox', _.assign({
        value: new Objectbox(gadDbPath, maxGadNum)
    }, propWritable));

    Object.defineProperty(this, '_apis', _.assign({ value: {} }, propUnwritable));
    // Object.defineProperty(this, '_plugins', _.assign({ value: [] }, propUnwritable));
    // Object.defineProperty(this, '_rpcServers', _.assign({ value: [] }, propUnwritable));

    // default authenticate all clients, override at will
    this.authenticate = function (rpcClient, data, cb) {
        utils.feedbackNextTick(null, true, cb);
    };

    // default authorize all clients, override at will
    this.authorize = function (rpcClient, cb) {
        utils.feedbackNextTick(null, true, cb);
    };
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
Freebird.prototype.findById = function (type, id) {
    // type = 'netcore', 'device', 'gagdet'
    var target;

    if (type === 'netcore')
        target = _.find(this._netcores, function (nc) {
            return nc.getName() === id;
        });
    else if (type === 'device')
        target = this._devbox.get(id);
    else if (type === 'gadget')
        target = this._gadbox.get(id);
    else
        throw new TypeError('Unknow type: ' + type + ' to find for');

    return target;
};

Freebird.prototype.findByNet = function (type, ncName, permAddr, auxId) {
    // type = 'netcore', 'device', 'gagdet'
    var target;

    if (type === 'netcore')
        target = _.find(this._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    else if (type === 'device')
        target = this._devbox.find(function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
    else if (type === 'gadget')
        target = this._gadbox.find(function (gad) {
            return (gad.get('permAddr') === permAddr) && (gad.get('auxId') === auxId) && (gad.get('netcore').getName() === ncName);
        });
    else
        throw new TypeError('Unknow type: ' + type + ' to find for');

    return target;
};

/***********************************************************************/
/*** Public Methods: Device and Gadget Registeration                 ***/
/***********************************************************************/
Freebird.prototype.register = registry.register;
Freebird.prototype.unregister = registry.unregister;

/***********************************************************************/
/*** Public Methods: Network Management                              ***/
/***********************************************************************/
Freebird.prototype.start = function (callback) {
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            process.nextTick(function () {
                self.emit('error', err);
            });
            cbCalled = true;
            callback(err);
        } else {
            netcores.forEach(function (nc) {    // start all netcores
                nc.start(function (er) {
                    ncNum -= 1;
                    if (er && !cbCalled) {
                        self.emit('error', er);
                        callback();
                    }

                    else if (ncNum === 0 && !cbCalled)
                        callback();
                });
            });
        }
    });
};

Freebird.prototype.stop = function (callback) {
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;


};

Freebird.prototype.reset = methodGenerator2('reset');
Freebird.prototype.permitJoin = methodGenerator2('permitJoin');

Freebird.prototype.remove = methodGenerator3('remove');
Freebird.prototype.ban = methodGenerator3('ban');
Freebird.prototype.unban = methodGenerator3('unban');
Freebird.prototype.ping = methodGenerator3('ping');
Freebird.prototype.maintain = methodGenerator3('maintain'); // [TODO] Should implement in netcore

/***********************************************************************/
/*** Public Methods: Transportation                                  ***/
/***********************************************************************/
Freebird.prototype.addRpcServer = function (name) {};
Freebird.prototype.removeRpcServer = function (name) {};
Freebird.prototype.findRpcServer = function (name) {};

/***********************************************************************/
/*** Event Tweeting                                                  ***/
/***********************************************************************/
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

/***********************************************************************/
/*** Prototype Methods Generator                                     ***/
/***********************************************************************/
function methodGenerator2(method, args) {
    var netcores = this._netcores,
        numOfNcs = netcores.length,
        method = nc[method],
        cbCalled = false;

    _.forEach(netcores, function (nc) {
        try {
            method();
            numOfNcs -= 1;
        } catch (e) {
            callback(e);
            cbCalled = true;
        }

        if (numOfNcs === 0 && !cbCalled)
            callback(null, netcores.length);
    });
}

function methodGenerator3(methodName) {
    return function (ncName, permAddr, callback) {
        var netcore = this.findByNet('netcore', ncName),
            method;

        if (!netcore)
            return setImmediate(callback, new Error('netcore: ' + ncName + ' not found'));

        method = netcore[methodName];
        method(permAddr, callback);
    }
}

module.exports = Freebird;
