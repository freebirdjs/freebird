var _ = require('lodash'),
    should = require('should-promised'),
    fs = require('fs'),
    DataStore = require('nedb'),
    Fbdb = require('../lib/fbdb');

var fbdb,
	dbPath = '../lib/cc254x/database/fb.db';

fs.exists(dbPath, function (isThere) {
    if (isThere) { fs.unlink(dbPath); }
});

var 

describe('Constructor Check', function (done) {
	it('new Fbdb()', function () {
		(function () {(new Fbdb({})).should.throw(); })
		(function () {(new Fbdb([])).should.throw(); })
		(function () {(new Fbdb(true)).should.throw(); })
		(function () {(new Fbdb(123)).should.throw(); })
		(function () {(new Fbdb(undefined)).should.throw(); })

		fbdb = new Fbdb('/home/hedy/freebird/freebird/lib/database/fb.db');
		if (fbdb._db instanceof DataStore) done();
	});
});

describe('Insert Check', function () {

});

describe('Find By Id Check', function () {

});

describe('Modify Check', function () {

});

describe('Replace Check', function () {

});

describe('Find All Check', function () {

});

describe('Remove By Id Check', function () {

});


    this._netcore = netcore;
    this._raw = rawDev;         // optional
    this._id = null;            // register@fb
    this._gads = [];            // when register gad @fb

    this._net = {
        enabled: false,         // {RPT}
        joinTime: null,         // POSIX Time, seconds since 1/1/1970, assigned by netcore at register
        timestamp: null,        // POSIX Time, seconds, fb should call dev._markActivity() to update it
        traffic: {              // {RRT} only report@reset
            in: { hits: 0, bytes: 0 },
            out: { hits: 0, bytes: 0 }
        },
        role: '',               // {RPT}
        parent: '0',            // {RPT} permanent address, default is '0' for netcore
        maySleep: false,        // {RPT} developer
        sleepPeriod: 30,        // {RPT} developer, seconds
        status: 'unknown',      // {RPT} online, offline, sleep, unknown
        address: {              // {RPT}
            permanent: '',
            dynamic: ''
        }
    };
    // getProp, setProp
    this._props = {
        name: undefined,               // client user local set
        description: undefined,        // client user local set
        location: undefined            // client user local set
    };
    // LOCAL: getAttr, setAttr; REMOTE: read, write
    this._attrs = {
        manufacturer: undefined,
        model: undefined,
        serial: undefined,
        version: {
            hw: undefined,
            sw: undefined,
            fw: undefined
        },
        power: {
            type: undefined,
            voltage: undefined
        }
    };

    this.extra = null;
}


 var __blacklist = [];

    this._joinTimer = null; // set @ permit join
    this._joinTicks = 0;    // set @ permit join

//    this._liveKeeper = null;  // @freebird, maybe plugin?

    this._controller = cfg.controller;              // required
    this._ticks = cfg.ticks;                        // sleep maintainer
    this._defaultJoinTime = cfg.defaultJoinTime;    // optional

    this._fb = null;

    this._net = {
        name: name,
        enabled: false,
        protocol: cfg.protocol,     // required
        startTime: 0,
        traffic: {
            in: {
                hits: 0,
                bytes: 0
            },
            out: {
                hits: 0,
                bytes: 0
            }
        }
    };

    this.extra = null;

    /* Developer overrides                                                                   */
    this.cookRawDev = null;         // function(dev, raw, callback) { callback(err, dev); }
    this.cookRawGad = null;         // function(gad, meta, callback) { callback(err, gad); }
    this.unifyRawDevAttrs = null;   // function(attrs) { return attrsObj; }
    this.unifyRawGadAttrs = null;   // function(attrs) { return attrsObj; }
    /* ------------------------------------------------------------------------------------- */

    this._drivers = {
        net: {
            start: null,        // function(callback) {}
            stop: null,         // function(callback) {}
            reset: null,        // function(callback) {}
            permitJoin: null,   // function(duration, callback) {}
            // maintain: null,     // function([permAddr][, callback]) {}
            remove: null,       // function(permAddr, callback) {}
            ban: null,          // function(permAddr, callback) {}
            unban: null,        // function(permAddr, callback) {}
            ping: null          // function(permAddr, callback) {}
        },
        dev: {
            read: null,         // function(permAddr, attr, callback) {}
            write: null,        // function(permAddr, attr, val, callback) {}
            identify: null,     // function(permAddr, callback) {}
        },
        gad: {
            read: null,         // function(permAddr, auxId, attr, callback) {}
            write: null,        // function(permAddr, auxId, attr, val, callback) {}
            exec: null,         // function(permAddr, auxId, attr, args, callback) {}
            setReportCfg: null, // function(permAddr, auxId, cfg, callback) {}
            getReportCfg: null, // function(permAddr, auxId, callback) {}
            report: null
        }
    };