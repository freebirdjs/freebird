/* jshint node: true */
'use strict';

var EventEmitter = require('events'),
    util = require('util');

var _ = require('busyman'),
    Objectbox = require('objectbox'),
    FbwsServer = require('freebird-websocket').Server,
    FreebirdBase = require('freebird-base');

var wsApis = require('./apis/ws'),
    drvApis = require('./apis/driver'),
    loader = require('./components/loader'),
    ncListeners = require('./components/nc_event_listeners');

var devboxPath = __dirname + '/database/dev.db',
    gadboxPath = __dirname + '/database/gad.db';

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(httpServer, opt) {    // opt: { maxDevNum: x, maxGadNum: y }
    var maxDevNum,
        maxGadNum;

    opt = opt || {};
    maxDevNum = opt.maxDevNum || 6000;
    maxGadNum = opt.maxGadNum || (3 * maxDevNum);

    if (maxGadNum < maxDevNum)
        throw new Error('Max gadget number cannot be less than max device number.');

    if (!(this instanceof Freebird))
        return new Freebird(httpServer);

    EventEmitter.call(this);

    this._httpServer = httpServer || null;
    this._wsServer = null;

    this._plugins = [];
    this._netcores = [];
    this._devbox = new Objectbox(devboxPath, maxDevNum);
    this._gadbox = new Objectbox(gadboxPath, maxGadNum);

    this._wsApis = {};      // bind websocket net, dev, and gad methods by bindWsApis()
    this.net = {};          // bind driver methods by bindDrivers()
    this.dev = {};
    this.gad = {};
    this._ncEventListeners = {};    // to manage all inner listeners

    // default authenticate all clients, override at will
    this.authenticate = function (wsClient, data, cb) {
        cb(null, true);
    };

    // default authorize all clients, override at will
    this.authorize = function (wsClient, cb) {
        cb(null, true);
    };

    ncListeners.attachEventListeners(this);
    drvApis.bindDrivers(this);
    wsApis.bindWsApis(this);
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Public Methods: find and get                                    ***/
/***********************************************************************/
Freebird.prototype.find = function (type, pred) {
    var target;

    switch (type) {
        case 'nc':
        case 'netcore':
            target = _.isFunction(pred) ? _.find(this._netcores, pred) : _.find(this._netcores, function (core) {
                return core.getName() === pred;
            });
            break;
        case 'dev':
        case 'device':
            target = _.isFunction(pred) ? this._devbox.find(pred) : this._devbox.get(id);
            break;
        case 'gad':
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
            target = this.[subsys] ? this.[subsys][cmdName] : undefined;
            break;
        default;
            break;
    }
    return target;
};

Freebird.prototype.findFromNetcore = function (ncName, type, permAddr, auxId) {
    var target;

    if (arguments.length === 3) {           // find device
        target = this.find('device', function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
    } else if (arguments.length === 4) {    // find gadget
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
    var unregFn = registry.method('register', type);

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
Freebird.prototype._emitws = function (evt, fbMsg, wsMsg) {
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
