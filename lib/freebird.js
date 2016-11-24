'use strict';

var path = require('path'),
    util = require('util'),
    EventEmitter = require('events');

var _ = require('busyman'),
    Objectbox = require('objectbox');

var Agent = require('./rpc/agent.js'),
    validate = require('./utils/validate.js'),
    netmgmt = require('./components/netmgmt.js'),
    registry = require('./components/registry.js'),
    attachHandlers = require('./components/handlers.js');

/***********************************************************************/
/*** Freebird Class                                                  ***/
/***********************************************************************/
function Freebird(name, netcores, options) {
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
        devDbPath = (_.isObject(opt.dbPaths) ? opt.dbPaths.device : undefined) || devboxPath,
        gadDbPath = (_.isObject(opt.dbPaths) ? opt.dbPaths.gadget : undefined) || gadboxPath;

    if (maxGadNum < maxDevNum)
        throw new Error('Max gadget number cannot be less than max device number');

    netcores = _.isArray(netcores) ? netcores : [ netcores ];

    var ncNames = [];
    _.forEach(netcores, function (nc, i) {
        var ncName;
        nc._freebird = validate.isNetcore(nc) ? self : throw new TypeError('Element of index ' + i + ' is not a valid netcore');
        ncName = nc.getName();

        if (!_.includes(ncNames, ncName))
            ncNames.push(ncName);
        else
            throw new Error('Netcore name duplicates: ' + ncName);
    });

    EventEmitter.call(this);

    Object.defineProperty(this, 'name', { writable: false, enumerable: true, configurable: false, value: name });
    Object.defineProperty(this, '_netcores', _.assign({ value: netcores }, propUnwritable));
    Object.defineProperty(this, '_devbox', _.assign({ value: new Objectbox(devDbPath, maxDevNum) }, propWritable));
    Object.defineProperty(this, '_gadbox', _.assign({ value: new Objectbox(gadDbPath, maxGadNum) }, propWritable));
    Object.defineProperty(this, '_apiAgent', _.assign({ value: new Agent(this) }, propUnwritable));

    attachHandlers(this);

    // Leave authenticate and authorize to rpc server implementer
}

util.inherits(Freebird, EventEmitter);

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
Freebird.prototype.addTransport = function (transp, callback) {
    this._apiAgent.addTransport(transp, callback);
    return this;
};

Freebird.prototype.findById = function (type, id) {
    // type only accepts: 'netcore', 'device', 'gagdet'
    if (type === 'netcore')
        return _.find(this._netcores, function (nc) {
            return nc.getName() === id;
        });
    else if (type === 'device')
        return this._devbox.get(id);
    else if (type === 'gadget')
        return this._gadbox.get(id);
    else
        throw new TypeError('Unknow type: ' + type + ' to find with');
};

Freebird.prototype.findByNet = function (type, ncName, permAddr, auxId) {
    // type only accepts: 'netcore', 'device', 'gagdet'
    if (type === 'netcore')
        return _.find(this._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    else if (type === 'device')
        return this._devbox.find(function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
    else if (type === 'gadget')
        return this._gadbox.find(function (gad) {
            return (gad.get('permAddr') === permAddr) && (gad.get('auxId') === auxId) && (gad.get('netcore').getName() === ncName);
        });
    else
        throw new TypeError('Unknow type: ' + type + ' to find with');
};

Freebird.prototype.filter = function (type, pred) {
    if (type === 'netcore')
        return _.filter(this._netcores, pred);
    else if (type === 'device')
        return this._devbox.filter(pred);
    else if (type === 'gadget')
        return this._gadbox.filter(pred);
    else
        throw new TypeError('Unknow type: ' + type + ' to find with');
};

/***********************************************************************/
/*** Public Methods: Registeration and Network Management            ***/
/***********************************************************************/
Freebird.prototype.register = registry.register;

Freebird.prototype.unregister = registry.unregister;

Freebird.prototype.start = netmgmt.start;

Freebird.prototype.stop = netmgmt.stop;

Freebird.prototype.reset = netmgmt.reset;

Freebird.prototype.permitJoin = netmgmt.permitJoin;

Freebird.prototype.remove = netmgmt.remove;

Freebird.prototype.ban = netmgmt.ban;

Freebird.prototype.unban = netmgmt.unban;

Freebird.prototype.ping = netmgmt.ping;

Freebird.prototype.maintain = netmgmt.maintain; // [TODO] MUST IMPLEMENT

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Freebird.prototype._fire = function (evt, data) {                   // Fire in-process events
    var self = this;

    setImmediate(function () {
        self.emit(evt, data);
    });
};

Freebird.prototype._tweet = function (subsys, indType, id, data) {  // Send RPC indications
    var self = this,
        ind = { __intf: 'IND', subsys: 'net', type: 'started', id: 0, data: {} };

    if (subsys === 'net' || subsys === RPC.Subsys.net)
        ind.subsys = RPC.Subsys.net;
    else if (subsys === 'dev' || subsys === RPC.Subsys.dev)
        ind.subsys = RPC.Subsys.dev;
    else if (subsys === 'gad' || subsys === RPC.Subsys.gad)
        ind.subsys = RPC.Subsys.gad;

    setImmediate(function () {
        self._apiAgent.indicate(ind, function (err) {
            self._fire();   // [TODO] error event name?
        });
    });
};

module.exports = Freebird;
