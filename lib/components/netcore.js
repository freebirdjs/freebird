var EventEmitter = require('events'),
    util = require('util'),
    _ = require('lodash'),
    Q = require('q'),
    debug = require('debug')('coat:netcore'),
    NetCoreError = require('../utils/coatError').NetCoreError;

function NetCore() {
    this.name = name;
    this.busAttrs = {
        attr: null,
        show: function (nus_type) {},
        store: function (bus_type, buf, count) {}
    };
    this.devAttrs = {};
    this.drvAttrs = {};

    this.match = function (dev, devDrv) {};
    this.uevent = function (dev, uevt_env) {};
    this.probe = function (dev) {};
    this.remove = function (dev) {};
}

NetCore.prototype.x = function () {};

