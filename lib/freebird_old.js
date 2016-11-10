'use strict';

var EventEmitter = require('events'),
    util = require('util');

var _ = require('busyman'),
    Objectbox = require('objectbox'),
    FbwsServer = require('freebird-websocket').Server;

var utils = require('./utils/utils'),
    wsApis = require('./apis/ws'),
    drvApis = require('./apis/driver'),
    loader = require('./components/loader'),
    registry = require('./components/registry'),
    ncListeners = require('./components/nc_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(options) {    // options: { maxDevNum: x, maxGadNum: y, dbPaths: { device, gadget } }
    var propSetting1 = { writable: true, enumerable: false, configurable: false },
        propSetting2 = { writable: false, enumerable: false, configurable: false };

    opt = opt || {};

    var maxDevNum = opt.maxDevNum || 600,
        maxGadNum = opt.maxGadNum || (3 * maxDevNum),
        devDbPath = (opt.dbPaths ? opt.dbPaths.device : devboxPath) || devboxPath,
        gadDbPath = (opt.dbPaths ? opt.dbPaths.gadget : gadboxPath) || gadboxPath;

    if (maxGadNum < maxDevNum)
        throw new Error('Max gadget number cannot be less than max device number.');

    if (!(this instanceof Freebird))
        return new Freebird(opt);

    EventEmitter.call(this);

    // Object.defineProperty(this, '_httpServer', _.assign({ value: httpServer || null }, propSetting1));
    // Object.defineProperty(this, '_wsServer', _.assign({ value: null }, propSetting1));
    Object.defineProperty(this, '_rpcServers', _.assign({ value: [] }, propSetting2));
    Object.defineProperty(this, '_plugins', _.assign({ value: [] }, propSetting2));
    Object.defineProperty(this, '_netcores', _.assign({ value: [] }, propSetting2));

    Object.defineProperty(this, '_devbox', _.assign({ value: new Objectbox(devboxPath, maxDevNum) }, propSetting1));
    Object.defineProperty(this, '_gadbox', _.assign({ value: new Objectbox(gadboxPath, maxGadNum) }, propSetting1));
    Object.defineProperty(this, '_ncEventListeners', _.assign({ value: {} }, propSetting1));    // to manage all inner listeners

    // bind websocket net, dev, and gad methods by bindWsApis()
    Object.defineProperty(this, '_wsApis', _.assign({ value: {} }, propSetting1));

    // bind net, dev, and gad driver methods by bindDrivers()
    this.net = {};
    this.dev = {};
    this.gad = {};

    // default authenticate all clients, override at will
    this.authenticate = function (wsClient, data, cb) {
        utils.feedbackNextTick(null, true, cb);
    };

    // default authorize all clients, override at will
    this.authorize = function (wsClient, cb) {
        utils.feedbackNextTick(null, true, cb);
    };

    ncListeners.attachEventListeners(this);
    drvApis.bindDrivers(this);
    wsApis.bindWsApis(this);
}

util.inherits(Freebird, EventEmitter);

// [TODO] attach rpc server
Freebird.prototype.rpc = function (server) {
    var rpcServers = this._rpcServers;
    if (_.includes(rpcServers, server))
        return;
    else if (_.find(rpcServers, function (srv) {
        return srv.name === server.name;
    }))
        throw new Error(server.name + ' already exists');


    // server.send
    // server.receive
};

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
Freebird.prototype.find = function (type, pred) {
    var target;

    switch (type) {
        case 'netcore':
            target = _.isFunction(pred) ? _.find(this._netcores, pred) : _.find(this._netcores, function (core) {
                return core.getName() === pred;
            });
            break;
        case 'device':
            target = _.isFunction(pred) ? this._devbox.find(pred) : this._devbox.get(pred);
            break;
        case 'gadget':
            target = _.isFunction(pred) ? this._gadbox.find(pred) : this._gadbox.get(pred);
            break;
        case 'plugin':
            // target = _.isFunction(pred) ? _.find(this._plugins, pred) : [TODO] );
            break;
        case 'wsApi':   // [findWsApi] type, subsys, cmdName
            var subsys = arguments[1],
                cmdName = arguments[2];
            target = this._wsApis[subsys] ? this._wsApis[subsys][cmdName] : undefined;
            break;
        case 'driver':   // type, subsys, cmdName
            var subsys = arguments[1],
                cmdName = arguments[2];
            target = this[subsys] ? this[subsys][cmdName] : undefined;
            break;
        default:
            throw new TypeError('Finding for type: ' + type + ' is not supported');
            break;
    }
    return target;
};

Freebird.prototype.findFromNetcore = function (ncName, permAddr, auxId) {
    var target;

    if (arguments.length === 2) {           // find device
        target = this.find('device', function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
    } else if (arguments.length === 3) {    // find gadget
        target = this.find('gadget', function (gad) {
            return (gad.get('permAddr') === permAddr) && (gad.get('auxId') === auxId) && (gad.get('netcore').getName() === ncName);
        });
    }
    return target;
};

/***********************************************************************/
/*** Public Methods: Start and Stop                                  ***/
/***********************************************************************/
Freebird.prototype.start = function (callback) {
    var self = this,
        netcores = this._netcores;

    // init web service (websocket)
    if (this._httpServer) {
        this._wsServer = new FbwsServer(this);
        this._wsServer.start(this._httpServer);
    }

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            // [TODO] emit error
            callback(err);
        } else {
            // start all netcores
            netcores.forEach(function (nc) {
                self.net.start(nc.getName()); // ncName = 'mock' for testing
            });
            callback(null);
        }
    });
};

Freebird.prototype.stop = function () {
    // stop all netcores
};

/***********************************************************************/
/*** Public Methods: Registeration                                   ***/
/***********************************************************************/
Freebird.prototype.register = function (type, obj, callback) {
    var regFn = registry.method('register', type);

    if (_.isFunction(regFn))
        return regFn(this, obj, callback);

    process.nextTick(function () {
        callback(new Error('Invalid type: ' + type + ' to do registration.'));
    });
    return this;
};

Freebird.prototype.unregister = function (type, obj, callback) {
    var unregFn = registry.method('unregister', type);

    if (_.isFunction(unregFn))
        return unregFn(this, obj, callback);

    process.nextTick(function () {
        callback(new Error('Invalid type: ' + type + ' to do unregistration.'));
    });
    return this;
};

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Freebird.prototype._fireup = function (evt, fbMsg, wsMsg) {
    var self = this;

    setImmediate(function () {
        self.emit(evt, fbMsg);
    });

    // pass event to ws-server
    if (this._wsServer) {
        try {
            this._wsServer.receiveFreebirdEvent(evt, wsMsg);
        } catch (e) {
            // console.log(e); // log: handler not found
        }
    }

    if (this._plugins.length) {
        _.forEach(this._plugins, function (plg) {
            process.nextTick(function () {
                plg.receiveFreebirdEvent(evt, fbMsg);
            });
        });
    }
};

Freebird.prototype._getWsServer = function () {
    return this._wsServer;
};

Freebird.prototype._fire = function (evt, fbMsg, wsMsg) {
    // turn fbMsg to wsMsg

    // pass event to ws-server
    if (this._wsServer) {
        try {
            this._wsServer.receiveFreebirdEvent(evt, wsMsg);
        } catch (e) {
            // console.log(e); // log: handler not found
        }
    }

    if (this._plugins.length) {
        _.forEach(this._plugins, function (plg) {
            process.nextTick(function () {
                plg.receiveFreebirdEvent(evt, fbMsg);
            });
        });
    }

    this.emit(evt, fbMsg);
};

module.exports = Freebird;
