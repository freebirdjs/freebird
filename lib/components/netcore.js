var EventEmitter = require('events'),
    util = require('util'),
    _ = require('lodash');

function Netcore() {
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

    //----------------------------
    this.cookDevice = null;
    this.cookGadget = null;
    this.classifyGadget = null;
}

Netcore.prototype.createDevice = function (raw) {
    return new Device;
};

