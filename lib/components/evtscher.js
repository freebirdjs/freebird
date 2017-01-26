'use strict';

var _ = require('busyman'),
    BTM_EVTS = require('freebird-constants').EVENTS_FROM_BOTTOM;

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

        if (this._evts[0].name === BTM_EVTS.NcDevIncoming)
            process.nextTick(keepRunning.bind(this));
        else
            setImmediate(keepRunning.bind(this));
    }

    function keepRunning() {
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
    }
};

module.exports = EvtScheduler;
