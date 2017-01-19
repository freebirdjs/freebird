var EventEmitter = require('events'),
    fb = new EventEmitter();

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var rpcApis = require('../lib/rpc/apis'),
    FBase = require('freebird-base');

var zCore = FBase.createNetcore('zCore', {}, { phy: 'ieee802.15.4', nwk: 'zigbee' }),
    mCore = FBase.createNetcore('mCore', {}, { phy: 'ieee802', nwk: 'ip' });

var zDev1 = FBase.createDevice(zCore, {}),
    zDev2 = FBase.createDevice(zCore, {}),
    zDev3 = FBase.createDevice(zCore, {}),
    mDev1 = FBase.createDevice(mCore, {});

var zGad1 = FBase.createGadget(zDev1, '1/temperature', {}),
    zGad2 = FBase.createGadget(zDev1, '2/humidity.', {}),
    zGad3 = FBase.createGadget(zDev2, '1/lightCtrl', {}),
    mGad1 = FBase.createGadget(mDev1, '1/lightCtrl', {});

zDev1.set('net', { address: { permanent: '0x1234567890' } });
zDev1.set('_id', 1);
zDev2.set('_id', 2);
zDev3.set('_id', 3);
mDev1.set('_id', 6);

zGad1.set('_id', 1);
zGad2.set('_id', 3);
zGad3.set('_id', 5);
mGad1.set('_id', 7);

fb._netcores = [ zCore, mCore ];
fb._devices = [zDev1, zDev2, zDev3, mDev1];
fb._gadgets = [zGad1, zGad2, zGad3, mGad1];

fb._devbox = {
    exportAllIds: function () {
        return _.map(fb._devices, function (dev) {
            return dev.get('id');
        });
    },
    filter: function (path) {
        return _.filter(fb._devices, path);
    }
};

fb._gadbox = {
    exportAllIds: function () {
        return _.map(fb._gadgets, function (gad) {
            return gad.get('id');
        });
    },
    filter: function (path) {
        return _.filter(fb._gadgets, path);
    }
};

fb.findById = function (type, id) {
    if (type === 'netcore')
        return _.find(fb._netcores, function (nc) {
            return nc.getName() === id;
        });
    else if (type === 'device')
        return _.find(fb._devices, function (dev) {
            return dev.get('id') === id;
        });
    else if (type === 'gadget')
        return _.find(fb._gadgets, function (gad) {
            return gad.get('id') === id;
        });
};

fb.findByNet = function (type, ncName, permAddr) {
    if (type === 'netcore')
        return _.find(fb._netcores, function (nc) {
            return nc.getName() === ncName;
        });
    else if (type === 'device')
        return _.find(fb._devices, function (dev) {
            return (dev.get('permAddr') === permAddr) && (dev.get('netcore').getName() === ncName);
        });
};

fb._fire = function (evt, data) {
    var self = this;
    setImmediate(function () {
        self.emit(evt, data);
    });
};

fb.permitJoin = function (duration, callback) {};
fb.reset = function (mode, callback) {};
fb.maintain = function (ncName, callback) {};

describe('APIs - signature checks', function() {
    var apiNames = {
        net: [],
        dev: [],
        gad: []
    };

    for (var subSys in RPC.Api) {
        for (var apiName in RPC.Api[subSys]) {
            apiNames[subSys].push(apiName);
        }
    }

    describe('# check all net apis are function', function() {
        it('should throw if there is a lack of net apis', function () {
            var allFunc = true;
            apiNames.net.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis[apiName] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all dev apis are function', function() {
        it('should throw if there is a lack of dev apis', function () {
            var allFunc = true;
            apiNames.dev.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis['dev' + _.upperFirst(apiName)] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all gad apis are function', function() {
        it('should throw if there is a lack of gad apis', function () {
            var allFunc = true;
            apiNames.gad.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis['gad' + _.upperFirst(apiName)] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    for (var rpcApi in rpcApis) {
        rpcApis[rpcApi] = rpcApis[rpcApi].bind(fb);
    }


    // subSys: 'net'
    describe('#.getAllDevIds', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.getAllDevIds({ ncName: 1 }, cb);
            rpcApis.getAllDevIds({ ncName: {} }, cb);
            rpcApis.getAllDevIds({ ncName: [] }, cb);
            rpcApis.getAllDevIds({ ncName: NaN }, cb);
            rpcApis.getAllDevIds({ ncName: new Date() }, cb);
            rpcApis.getAllDevIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getAllGadIds', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.getAllGadIds({ ncName: 1 }, cb);
            rpcApis.getAllGadIds({ ncName: {} }, cb);
            rpcApis.getAllGadIds({ ncName: [] }, cb);
            rpcApis.getAllGadIds({ ncName: NaN }, cb);
            rpcApis.getAllGadIds({ ncName: new Date() }, cb);
            rpcApis.getAllGadIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getDevs', function() {
        it('should has error if args.ids is not an array of number or string', function (done) {
            var errMsg = 'ids should be an array of number or string',
                cb = getCheckedCb(7, errMsg, done);

            rpcApis.getDevs({ ids: 1 }, cb);
            rpcApis.getDevs({ ids: {} }, cb);
            rpcApis.getDevs({ ids: NaN }, cb);
            rpcApis.getDevs({ ids: new Date() }, cb);
            rpcApis.getDevs({ ids: function () {} }, cb);
            rpcApis.getDevs({ ids: null }, cb);
            rpcApis.getDevs({ ids: undefined }, cb);
        });
    });

    describe('#.getGads', function() {
        it('should has error if args.ids is not an array of number or string', function (done) {
            var errMsg = 'ids should be an array of number or string',
                cb = getCheckedCb(7, errMsg, done);

            rpcApis.getGads({ ids: 1 }, cb);
            rpcApis.getGads({ ids: {} }, cb);
            rpcApis.getGads({ ids: NaN }, cb);
            rpcApis.getGads({ ids: new Date() }, cb);
            rpcApis.getGads({ ids: function () {} }, cb);
            rpcApis.getGads({ ids: null }, cb);
            rpcApis.getGads({ ids: undefined }, cb);
        });
    });

    describe('#.getNetcores', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.getAllGadIds({ ncName: 1 }, cb);
            rpcApis.getAllGadIds({ ncName: {} }, cb);
            rpcApis.getAllGadIds({ ncName: [] }, cb);
            rpcApis.getAllGadIds({ ncName: NaN }, cb);
            rpcApis.getAllGadIds({ ncName: new Date() }, cb);
            rpcApis.getAllGadIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getBlacklist', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.getBlacklist({ ncName: 1 }, cb);
            rpcApis.getBlacklist({ ncName: {} }, cb);
            rpcApis.getBlacklist({ ncName: [] }, cb);
            rpcApis.getBlacklist({ ncName: NaN }, cb);
            rpcApis.getBlacklist({ ncName: new Date() }, cb);
            rpcApis.getBlacklist({ ncName: function () {} }, cb);
            rpcApis.getBlacklist({ ncName: null }, cb);
            rpcApis.getBlacklist({ ncName: undefined }, cb);
        });
    });

    describe('#.permitJoin', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.permitJoin({ ncName: 1, duration: 180 }, cb);
            rpcApis.permitJoin({ ncName: {}, duration: 180 }, cb);
            rpcApis.permitJoin({ ncName: [], duration: 180 }, cb);
            rpcApis.permitJoin({ ncName: NaN, duration: 180 }, cb);
            rpcApis.permitJoin({ ncName: new Date(), duration: 180 }, cb);
            rpcApis.permitJoin({ ncName: function () {}, duration: 180 }, cb);
        });

        it('should has error if args.duration is not a number', function (done) {
            var errMsg = 'duration should be a number',
                cb = getCheckedCb(7, errMsg, done);

            rpcApis.permitJoin({ ncName: 'zCore', duration: '1' }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: {} }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: [] }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: null }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: undefined }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: new Date() }, cb);
            rpcApis.permitJoin({ ncName: 'zCore', duration: function () {} }, cb);
        });
    });

    describe('#.reset', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.reset({ ncName: 1, mode: 0 }, cb);
            rpcApis.reset({ ncName: {}, mode: 0 }, cb);
            rpcApis.reset({ ncName: [], mode: 0 }, cb);
            rpcApis.reset({ ncName: NaN, mode: 0 }, cb);
            rpcApis.reset({ ncName: new Date(), mode: 0 }, cb);
            rpcApis.reset({ ncName: function () {}, mode: 0 }, cb);
        });

        it('should has error if args.mode is not a number', function (done) {
            var errMsg = 'mode only accepts 0 or 1',
                cb = getCheckedCb(7, errMsg, done);

            rpcApis.reset({ ncName: 'zCore', mode: '1' }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: {} }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: [] }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: null }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: undefined }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: new Date() }, cb);
            rpcApis.reset({ ncName: 'zCore', mode: function () {} }, cb);
        });
    });

    describe('#.enable', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.enable({ ncName: 1 }, cb);
            rpcApis.enable({ ncName: {} }, cb);
            rpcApis.enable({ ncName: [] }, cb);
            rpcApis.enable({ ncName: NaN }, cb);
            rpcApis.enable({ ncName: new Date() }, cb);
            rpcApis.enable({ ncName: function () {} }, cb);
        });
    });

    describe('#.disable', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.disable({ ncName: 1 }, cb);
            rpcApis.disable({ ncName: {} }, cb);
            rpcApis.disable({ ncName: [] }, cb);
            rpcApis.disable({ ncName: NaN }, cb);
            rpcApis.disable({ ncName: new Date() }, cb);
            rpcApis.disable({ ncName: function () {} }, cb);
        });
    });

    describe('#.ban', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.ban({ ncName: 1, permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: {}, permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: [], permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: NaN, permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: null, permAddr: '0x123456789' }, cb);
            rpcApis.ban({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.ban({ ncName: 'zCore', permAddr: 1 }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: {} }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: [] }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: NaN }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: new Date() }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: function () {} }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: null }, cb);
            rpcApis.ban({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.unban', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.unban({ ncName: 1, permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: {}, permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: [], permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: NaN, permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: null, permAddr: '0x123456789' }, cb);
            rpcApis.unban({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.unban({ ncName: 'zCore', permAddr: 1 }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: {} }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: [] }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: NaN }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: new Date() }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: function () {} }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: null }, cb);
            rpcApis.unban({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.remove', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.remove({ ncName: 1, permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: {}, permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: [], permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: NaN, permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: null, permAddr: '0x123456789' }, cb);
            rpcApis.remove({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.remove({ ncName: 'zCore', permAddr: 1 }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: {} }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: [] }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: NaN }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: new Date() }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: function () {} }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: null }, cb);
            rpcApis.remove({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.ping', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.ping({ ncName: 1, permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: {}, permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: [], permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: NaN, permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: null, permAddr: '0x123456789' }, cb);
            rpcApis.ping({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            rpcApis.ping({ ncName: 'zCore', permAddr: 1 }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: {} }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: [] }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: NaN }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: new Date() }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: function () {} }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: null }, cb);
            rpcApis.ping({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.maintain', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.maintain({ ncName: 1 }, cb);
            rpcApis.maintain({ ncName: {} }, cb);
            rpcApis.maintain({ ncName: [] }, cb);
            rpcApis.maintain({ ncName: NaN }, cb);
            rpcApis.maintain({ ncName: new Date() }, cb);
            rpcApis.maintain({ ncName: function () {} }, cb);
        });
    });

    // subSys: 'dev'
    describe('#enable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devEnable({}, cb);
            rpcApis.devEnable({ id: {} }, cb);
            rpcApis.devEnable({ id: [] }, cb);
            rpcApis.devEnable({ id: true }, cb);
            rpcApis.devEnable({ id: null }, cb);
        });
    });

    describe('#disable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devDisable({}, cb);
            rpcApis.devDisable({ id: {} }, cb);
            rpcApis.devDisable({ id: [] }, cb);
            rpcApis.devDisable({ id: true }, cb);
            rpcApis.devDisable({ id: null }, cb);
        });
    });

    describe('#read(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devRead({ attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: {}, attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: [], attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: true, attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: null, attrName: 'xxx' }, cb);
        });

        it('should has error if args.attrName is not string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devRead({ id: 'xxx' }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: true }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: [] }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: {} }, cb); 
            rpcApis.devRead({ id: 'xxx', attrName: null }, cb); 
        });
    });

    describe('#write(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devWrite({ attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: {}, attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: [], attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: true, attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: null, attrName: 'xxx' }, cb);
        });

        it('should has error if args.attrName is not string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devWrite({ id: 'xxx' }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: true }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: [] }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: {} }, cb); 
            rpcApis.devWrite({ id: 'xxx', attrName: null }, cb); 
        });
    });

    describe('#identify(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devIdentify({}, cb);
            rpcApis.devIdentify({ id: {} }, cb);
            rpcApis.devIdentify({ id: [] }, cb);
            rpcApis.devIdentify({ id: true }, cb);
            rpcApis.devIdentify({ id: null }, cb);
        });
    });

    describe('#getProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devGetProps({}, cb);
            rpcApis.devGetProps({ id: {} }, cb);
            rpcApis.devGetProps({ id: [] }, cb);
            rpcApis.devGetProps({ id: true }, cb);
            rpcApis.devGetProps({ id: null }, cb);
        });

        it('should has error if args.propNames is exist and not a array of string', function (done) {
            var errMsg = 'propNames should be an array of string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devGetProps({ id: 'xxx', propNames: 'xxx' }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: 0 }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: {} }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: true }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: [ 1, 2, 3] }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: [true, 'xxx'] }, cb);
        });
    });

    describe('#setProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devSetProps({ props: {} }, cb);
            rpcApis.devSetProps({ id: {}, props: {} }, cb);
            rpcApis.devSetProps({ id: [], props: {} }, cb);
            rpcApis.devSetProps({ id: true, props: {} }, cb);
            rpcApis.devSetProps({ id: null, props: {} }, cb);
        });

        it('should has error if args.props is not a object', function (done) {
            var errMsg = 'props should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devSetProps({ id: 'xxx' }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: 'xxx' }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: 3 }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: [] }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: true }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: null }, cb);
        });
    });

    describe('#ping(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devPing({ }, cb);
            rpcApis.devPing({ id: {} }, cb);
            rpcApis.devPing({ id: [] }, cb);
            rpcApis.devPing({ id: true }, cb);
            rpcApis.devPing({ id: null }, cb);
        });
    });

    describe('#remove(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devRemove({ }, cb);
            rpcApis.devRemove({ id: {} }, cb);
            rpcApis.devRemove({ id: [] }, cb);
            rpcApis.devRemove({ id: true }, cb);
            rpcApis.devRemove({ id: null }, cb);
        });
    });


    // subSys: 'gad'
    describe('#enable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadEnable({ }, cb);
            rpcApis.gadEnable({ id: {} }, cb);
            rpcApis.gadEnable({ id: [] }, cb);
            rpcApis.gadEnable({ id: true }, cb);
            rpcApis.gadEnable({ id: null }, cb);
        });
    });

    describe('#disable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadDisable({ }, cb);
            rpcApis.gadDisable({ id: {} }, cb);
            rpcApis.gadDisable({ id: [] }, cb);
            rpcApis.gadDisable({ id: true }, cb);
            rpcApis.gadDisable({ id: null }, cb);
        });
    });

    describe('#read(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadRead({ }, cb);
            rpcApis.gadRead({ id: {} }, cb);
            rpcApis.gadRead({ id: [] }, cb);
            rpcApis.gadRead({ id: true }, cb);
            rpcApis.gadRead({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadRead({ id: 'xxx' }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#write(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadWrite({ }, cb);
            rpcApis.gadWrite({ id: {} }, cb);
            rpcApis.gadWrite({ id: [] }, cb);
            rpcApis.gadWrite({ id: true }, cb);
            rpcApis.gadWrite({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWrite({ id: 'xxx' }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#exec(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadExec({ }, cb);
            rpcApis.gadExec({ id: {} }, cb);
            rpcApis.gadExec({ id: [] }, cb);
            rpcApis.gadExec({ id: true }, cb);
            rpcApis.gadExec({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadExec({ id: 'xxx' }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: true }, cb);
        });

        it('should has error if args.param is exist and not a array', function (done) {
            var errMsg = 'params should be an array',
                cb = getCheckedCb(4, errMsg, done);

            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: 'xxx' }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: {} }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: true }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: 3 }, cb);
        });
    });

    describe('#readReportCfg(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadReadReportCfg({ }, cb);
            rpcApis.gadReadReportCfg({ id: {} }, cb);
            rpcApis.gadReadReportCfg({ id: [] }, cb);
            rpcApis.gadReadReportCfg({ id: true }, cb);
            rpcApis.gadReadReportCfg({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadReadReportCfg({ id: 'xxx' }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#writeReportCfg(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadWriteReportCfg({ }, cb);
            rpcApis.gadWriteReportCfg({ id: {} }, cb);
            rpcApis.gadWriteReportCfg({ id: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: true }, cb);
            rpcApis.gadWriteReportCfg({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWriteReportCfg({ id: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: true }, cb);
        });

        it('should has error if args.rptCfg is not an object', function (done) {
            var errMsg = 'rptCfg should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: 5 }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: true }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: null }, cb);
        });
    });

    describe('#getProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadGetProps({ }, cb);
            rpcApis.gadGetProps({ id: {} }, cb);
            rpcApis.gadGetProps({ id: [] }, cb);
            rpcApis.gadGetProps({ id: true }, cb);
            rpcApis.gadGetProps({ id: null }, cb);
        });

        it('should has error if args.propNames is exist and not a array of string', function (done) {
            var errMsg = 'propNames should be an array of string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadGetProps({ id: 'xxx', propNames: 'xxx' }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: 0 }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: {} }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: true }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: [ 1, 2, 3] }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: [true, 'xxx'] }, cb);
        });
    });

    describe('#setProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadSetProps({ props: {} }, cb);
            rpcApis.gadSetProps({ id: {}, props: {} }, cb);
            rpcApis.gadSetProps({ id: [], props: {} }, cb);
            rpcApis.gadSetProps({ id: true, props: {} }, cb);
            rpcApis.gadSetProps({ id: null, props: {} }, cb);
        });

        it('should has error if args.props is not a object', function (done) {
            var errMsg = 'props should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadSetProps({ id: 'xxx' }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: 'xxx' }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: 3 }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: [] }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: true }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: null }, cb);
        });
    });
});

describe('APIs - methods checks', function() {
    for (var rpcApi in rpcApis) {
        rpcApis[rpcApi] = rpcApis[rpcApi].bind(fb);
    }

    describe('#.getAllDevIds', function() {
        it('if args.ncName === undefined', function (done) {
            rpcApis.getAllDevIds({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: [ 1, 2, 3, 6 ],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.getAllDevIds({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\'', function (done) {
            rpcApis.getAllDevIds({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: [ 1, 2, 3 ],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });
    });

    describe('#.getAllGadIds', function() {
        it('if args.ncName === undefined', function (done) {
            rpcApis.getAllGadIds({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: [ 1, 3, 5, 7 ],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.getAllGadIds({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\'', function (done) {
            rpcApis.getAllGadIds({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    ids: [ 1, 3, 5 ],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });
    });

    describe('#.getDevs', function() {
        it('if args.ids === [ 1, 3, 6 ]', function (done) {
            rpcApis.getDevs({ ids: [ 1, 3, 6 ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.devs[0].id === 1 && data.devs[1].id === 3 && data.devs[2].id === 6)
                    done();
            });
        });

        it('if args.ids === [ 4, 6 ]', function (done) {
            rpcApis.getDevs({ ids: [ 4, 6 ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.devs[0] === null && data.devs[1].id === 6)
                    done();
            });
        });
    });

    describe('#.getGads', function() {
        it('if args.ids === [ 3, 5, 7 ]', function (done) {
            rpcApis.getGads({ ids: [ 3, 5, 7 ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.gads[0].id === 3 && data.gads[1].id === 5 && data.gads[2].id === 7)
                    done();
            });
        });

        it('if args.ids === [ 4, 6 ]', function (done) {
            rpcApis.getGads({ ids: [ 4, 6 ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.gads[0] === null && data.gads[1] === null)
                    done();
            });
        });
    });

    describe('#.getNetcores', function() {
        it('if args.ncNames === undefined', function (done) {
            rpcApis.getNetcores({}, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.netcores[0].name === 'zCore' && data.netcores[1].name === 'mCore')
                    done();
            });
        });

        it('if args.ncNames === [ \'mCore\' ]', function (done) {
            rpcApis.getNetcores({ ncNames: [ 'mCore' ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.netcores[0].name === 'mCore')
                    done();
            });
        });

        it('if args.ncNames === [ \'no_such_netCore\' ]', function (done) {
            rpcApis.getNetcores({ ncNames: [ 'no_such_netCore' ] }, function (err, data) {

                if (!err && data.id === 0 && data.status === RPC.Status.Content &&
                    data.netcores[0] === null)
                    done();
            });
        });
    });

    describe('#.getBlacklist', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.getBlacklist({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    list: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'mCore\' ]', function (done) {
            rpcApis.getBlacklist({ ncName: 'mCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    list: [],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            zCore._block('0x1234567890')._block('0x1357997531');
            rpcApis.getBlacklist({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    list: [ '0x1234567890', '0x1357997531' ],
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData)) {
                    zCore._unblock('0x1234567890')._unblock('0x1357997531');
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ], throw Error', function (done) {
            var nc_getBlacklistStub = sinon.stub(zCore, 'getBlacklist', function () {
                throw new Error('catchError');
            });

            rpcApis.getBlacklist({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    list: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'catchError' && _.isEqual(data, fakeData)) {
                    nc_getBlacklistStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.permitJoin', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.permitJoin({ ncName: 'no_such_netCore', duration: 180 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ], error', function (done) {
            var nc_permitJoinStub = sinon.stub(zCore, 'permitJoin', function (duration, callback) {
                process.nextTick(function () {
                    callback(new Error('PermitJoin fail'));
                });
            });

            rpcApis.permitJoin({ ncName: 'zCore', duration: 180 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'PermitJoin fail' && _.isEqual(data, fakeData)) {
                    nc_permitJoinStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            var nc_permitJoinStub = sinon.stub(zCore, 'permitJoin', function (duration, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.permitJoin({ ncName: 'zCore', duration: 180 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_permitJoinStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined, error', function (done) {
            var fb_permitJoinStub = sinon.stub(fb, 'permitJoin', function (duration, callback) {
                process.nextTick(function () {
                    callback(new Error('PermitJoin fails'));
                });
            });

            rpcApis.permitJoin({ duration: 180 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'PermitJoin fails' && _.isEqual(data, fakeData)) {
                    fb_permitJoinStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined', function (done) {
            var fb_permitJoinStub = sinon.stub(fb, 'permitJoin', function (duration, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.permitJoin({ duration: 180 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    fb_permitJoinStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.reset', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.reset({ ncName: 'no_such_netCore', mode: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ], error', function (done) {
            var nc_resetStub = sinon.stub(zCore, 'reset', function (mode, callback) {
                process.nextTick(function () {
                    callback(new Error('Reset fail'));
                });
            });

            rpcApis.reset({ ncName: 'zCore', mode: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Reset fail' && _.isEqual(data, fakeData)) {
                    nc_resetStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            var nc_resetStub = sinon.stub(zCore, 'reset', function (mode, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.reset({ ncName: 'zCore', mode: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_resetStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined, error', function (done) {
            var fb_resetStub = sinon.stub(fb, 'reset', function (mode, callback) {
                process.nextTick(function () {
                    callback(new Error('Reset fails'));
                });
            });

            rpcApis.reset({ mode: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Reset fails' && _.isEqual(data, fakeData)) {
                    fb_resetStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined', function (done) {
            var fb_resetStub = sinon.stub(fb, 'reset', function (mode, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.reset({ mode: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    fb_resetStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.enable', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.enable({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            rpcApis.enable({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ], throw Error', function (done) {
            var nc_enableStub = sinon.stub(zCore, 'enable', function () {
                throw new Error('catchError');
            });

            rpcApis.enable({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'catchError' && _.isEqual(data, fakeData)) {
                    nc_enableStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined', function (done) {
            rpcApis.enable({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    done();
                }
            });
        });

        it('if args.ncName === undefined and mCore throw Error', function (done) {
            var nc_enableStub = sinon.stub(mCore, 'enable', function () {
                    throw new Error('catchError');
                }),
                warned = false,
                cbCalled = false;

            fb.once('warn', function (err) {
                if (err.message === 'catchError') {
                    warned = true;
                    if (cbCalled)
                        done();
                }
            });

            rpcApis.enable({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_enableStub.restore();
                    cbCalled = true;
                    if (warned)
                        done();
                }
            });
        });
    });

    describe('#.disable', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.disable({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            rpcApis.disable({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ], throw Error', function (done) {
            var nc_disableStub = sinon.stub(zCore, 'disable', function () {
                throw new Error('catchError');
            });

            rpcApis.disable({ ncName: 'zCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'catchError' && _.isEqual(data, fakeData)) {
                    nc_disableStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined', function (done) {
            rpcApis.disable({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    done();
                }
            });
        });

        it('if args.ncName === undefined and mCore throw Error', function (done) {
            var nc_disableStub = sinon.stub(mCore, 'disable', function () {
                    throw new Error('catchError');
                }),
                warned = false,
                cbCalled = false;

            fb.once('warn', function (err) {
                if (err.message === 'catchError') {
                    warned = true;
                    if (cbCalled)
                        done();
                }
            });

            rpcApis.disable({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_disableStub.restore();
                    cbCalled = true;
                    if (warned)
                        done();
                }
            });
        });
    });

    describe('#.ban', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.ban({ ncName: 'no_such_netCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ], error', function (done) {
            var nc_banStub = sinon.stub(zCore, 'ban', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(new Error('Ban fail'));
                });
            });

            rpcApis.ban({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Ban fail' && _.isEqual(data, fakeData)) {
                    nc_banStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            var nc_banStub = sinon.stub(zCore, 'ban', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.ban({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_banStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.unban', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.unban({ ncName: 'no_such_netCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === [ \'zCore\' ], error', function (done) {
            var nc_unbanStub = sinon.stub(zCore, 'unban', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(new Error('Ban fail'));
                });
            });

            rpcApis.unban({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Ban fail' && _.isEqual(data, fakeData)) {
                    nc_unbanStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === [ \'zCore\' ]', function (done) {
            var nc_unbanStub = sinon.stub(zCore, 'unban', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.unban({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_unbanStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.remove', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.remove({ ncName: 'no_such_netCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    permAddr: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\' and device not found', function (done) {
            rpcApis.remove({ ncName: 'zCore', permAddr: '0x0000000001' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    permAddr: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\', error', function (done) {
            var nc_removeStub = sinon.stub(zCore, 'remove', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(new Error('Remove fail'));
                });
            });

            rpcApis.remove({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    permAddr: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Remove fail' && _.isEqual(data, fakeData)){
                    nc_removeStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === \'zCore\'', function (done) {
            var nc_removeStub = sinon.stub(zCore, 'remove', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(null, permAddr);
                });
            });

            rpcApis.remove({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    permAddr: '0x1234567890',
                    status: RPC.Status.Deleted
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_removeStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.ping', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.ping({ ncName: 'no_such_netCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    time: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\' and device not found', function (done) {
            rpcApis.ping({ ncName: 'zCore', permAddr: '0x0000000001' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    time: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === \'zCore\', error', function (done) {
            var nc_pingStub = sinon.stub(zCore, 'ping', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(new Error('Ping fail'));
                });
            });

            zCore.enable();
            zDev1.enable();
            rpcApis.ping({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    time: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Ping fail' && _.isEqual(data, fakeData)){
                    nc_pingStub.restore();
                    zDev1.disable();
                    zCore.disable();
                    done();
                }
            });
        });

        it('if args.ncName === \'zCore\'', function (done) {
            var nc_pingStub = sinon.stub(zCore, 'ping', function (permAddr, callback) {
                process.nextTick(function () {
                    callback(null, 10);
                });
            });

            zCore.enable();
            zDev1.enable();
            rpcApis.ping({ ncName: 'zCore', permAddr: '0x1234567890' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    time: 10,
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData)) {
                    nc_pingStub.restore();
                    zDev1.disable();
                    zCore.disable();
                    done();
                }
            });
        });
    });

    describe('#.maintain', function() {
        it('if args.ncName === \'no_such_netCore\'', function (done) {
            rpcApis.maintain({ ncName: 'no_such_netCore' }, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.ncName === undefined, error', function (done) {
            var fb_maintainStub = sinon.stub(fb, 'maintain', function (ncName, callback) {
                process.nextTick(function () {
                    callback(new Error('Maintain fails'));
                });
            });

            rpcApis.maintain({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Maintain fails' && _.isEqual(data, fakeData)) {
                    fb_maintainStub.restore();
                    done();
                }
            });
        });

        it('if args.ncName === undefined', function (done) {
            var fb_maintainStub = sinon.stub(fb, 'maintain', function (ncName, callback) {
                process.nextTick(function () {
                    callback(null);
                });
            });

            rpcApis.maintain({}, function (err, data) {
                var fakeData = {
                    id: 0,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData)) {
                    fb_maintainStub.restore();
                    done();
                }
            });
        });
    });

    /***********************************************/
    /*** Device APIs                             ***/
    /***********************************************/
    describe('#.devEnable', function() {
        it('if args.id === 0, no_such_device', function (done) {
            rpcApis.devEnable({ id: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    enabled: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.id === 1', function (done) {
            rpcApis.devEnable({ id: 1 }, function (err, data) {
                var fakeData = {
                    id: 1,
                    enabled: true,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.id === 2, throw Error', function (done) {
            var devEnableStub = sinon.stub(zDev2, 'enable', function () {
                throw new Error('catchError');
            });

            rpcApis.devEnable({ id: 2 }, function (err, data) {
                var fakeData = {
                    id: 2,
                    enabled: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'catchError' && _.isEqual(data, fakeData)) {
                    devEnableStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.devDisable', function() {
        it('if args.id === 0, no_such_device', function (done) {
            rpcApis.devDisable({ id: 0 }, function (err, data) {
                var fakeData = {
                    id: 0,
                    enabled: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.id === 1', function (done) {
            rpcApis.devDisable({ id: 1 }, function (err, data) {
                var fakeData = {
                    id: 1,
                    enabled: false,
                    status: RPC.Status.Ok
                };

                if (!err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.id === 2, throw Error', function (done) {
            var devEnableStub = sinon.stub(zDev2, 'disable', function () {
                throw new Error('catchError');
            });

            rpcApis.devDisable({ id: 2 }, function (err, data) {
                var fakeData = {
                    id: 2,
                    enabled: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'catchError' && _.isEqual(data, fakeData)) {
                    devEnableStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.devRead', function() {
        it('if args.id === 0, no_such_device', function (done) {
            rpcApis.devRead({ id: 0, attrName: 'manufacturer'}, function (err, data) {
                var fakeData = {
                    id: 0,
                    value: null,
                    status: RPC.Status.NotFound
                };

                if (err && _.isEqual(data, fakeData))
                    done();
            });
        });

        it('if args.id === 2, error', function (done) {
            var devEnableStub = sinon.stub(zDev2, 'read', function (attrName, callback) {
                process.nextTick(function () {
                    callback(new Error('Read fail'));
                });
            });

            rpcApis.devRead({ id: 2, attrName: 'manufacturer'}, function (err, data) {
                var fakeData = {
                    id: 2,
                    value: null,
                    status: RPC.Status.InternalServerError
                };

                if (err.message === 'Read fail' && _.isEqual(data, fakeData)) {
                    devEnableStub.restore();
                    done();
                }
            });
        });

        it('if args.id === 2', function (done) {
            var devEnableStub = sinon.stub(zDev2, 'read', function (attrName, callback) {
                process.nextTick(function () {
                    callback(null, 'abc');
                });
            });

            rpcApis.devRead({ id: 2, attrName: 'manufacturer'}, function (err, data) {
                var fakeData = {
                    id: 2,
                    value: 'abc',
                    status: RPC.Status.Content
                };

                if (!err && _.isEqual(data, fakeData)) {
                    devEnableStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.devWrite', function() {

    });

    describe('#.devIdentify', function() {

    });

    describe('#.devPing', function() {

    });

    describe('#.devRemove', function() {

    });

    describe('#.devGetProps', function() {

    });

    describe('#.devSetProps', function() {

    });

    /***********************************************/
    /*** Gadget APIs                             ***/
    /***********************************************/
    describe('#.gadEnable', function() {

    });

    describe('#.gadDisable', function() {

    });

    describe('#.gadRead', function() {

    });

    describe('#.gadWrite', function() {

    });

    describe('#.gadExec', function() {

    });

    describe('#.gadWriteReportCfg', function() {

    });

    describe('#.gadReadReportCfg', function() {

    });

    describe('#.gadGetProps', function() {

    });

    describe('#.gadSetProps', function() {

    });
});

function getCheckedCb (times, errMsg, done) {
    var checkNum = 0,
        cbCalled = false;

    return function (err) {
        if (err && (err instanceof TypeError) && (err.message === errMsg))
            checkNum += 1;

        if (cbCalled) {
            done();
        }

        if (checkNum === times) {
            cbCalled = true;
            done();
        }
    }; 
}
