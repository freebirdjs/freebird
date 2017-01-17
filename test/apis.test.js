var chai = require('chai'),
    expect = chai.expect,
    _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var rpcApis = require('../lib/rpc/apis');

var fb = {
    findById: function () { 
        return 5; 
    }
};

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
