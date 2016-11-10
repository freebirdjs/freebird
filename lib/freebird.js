'use strict';

var util = require('util'),
    _ = require('busyman'),
    Objectbox = require('objectbox'),
    EventEmitter = require('events');

var validate = require('./components/validate.js');


function Freebird(netcores, opts) {
    var propUnwritable = { writable: false, enumerable: false, configurable: false };

    EventEmitter.call(this);

    // [TODO] validate netcore
    netcores = _.isArray(netcores) ? netcores : [ netcores ];

    _.forEach(netcores, function (nc) {
        validate.netcore(nc);
        nc._freebird = freebird;
    });

    Object.defineProperty(this, '_apis', _.assign({ value: {} }, propUnwritable));
    Object.defineProperty(this, '_plugins', _.assign({ value: [] }, propUnwritable));
    Object.defineProperty(this, '_netcores', _.assign({ value: netcores }, propUnwritable));
    Object.defineProperty(this, '_rpcServers', _.assign({ value: [] }, propUnwritable));

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
/*** Public Methods: Network Management                              ***/
/***********************************************************************/
Freebird.prototype.enable = function (callback) {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.disable = function () {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.start = function () {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.stop = function () {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.reset = function () {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.permitJoin = function () {
    _.forEach(this._netcores, function (nc) {

    });
};

Freebird.prototype.remove = function () {

};

Freebird.prototype.ban = function () {
};

Freebird.prototype.unban = function () {
};

Freebird.prototype.ping = function () {
};

Freebird.prototype.maintain = function () {
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
