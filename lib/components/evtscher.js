'use strict';

var _ = require('busyman');

function EvtScheduler(freebird) {
    this._freebird = freebird;
	this._running = false;
	this._enabled = false;
	this._evts = [];
}

EvtScheduler.prototype.enable = function () {
    if (!this._enabled) {
        this._enabled = true;

        if (!this._running)
            this.run();
    }
    return this;
};

EvtScheduler.prototype.disable = function () {
    if (this._enabled) {
        this._enabled = false;
    }
    return this;
};

EvtScheduler.prototype.add = function (evt, data) {
    this._evts.push({ name: evt, msg: data});

    if (!this._running && this._enabled) {
        this.run();
    }
    return this;
};

EvtScheduler.prototype.clear = function () {
    this._evts.length = 0;
};

EvtScheduler.prototype.run = function () {
    if (this._evts.length === 0) {
        this._running = false;
    } else { 
        this._running = true;
        setImmediate(function () {
            var evtObj;

            if (!this._enabled) { 
                this._running = false;
                return;
            }

            if (this._evts.length !== 0) {
                evtObj = this._evts.shift();
                this._freebird.emit(evtObj.name, evtObj.msg);
                this.run();
            } else { 
                this._running = false;
            }  
        }.bind(this));
    }
};

module.exports = EvtScheduler;
