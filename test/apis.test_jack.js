var chai = require('chai'),
    expect = chai.expect;

var apis = require('../lib/rpc/apis.js');

describe('APIs - Signature Check', function() {
    describe('#.getAllDevIds', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.getAllDevIds({ ncName: 1 }, cb);
            apis.getAllDevIds({ ncName: {} }, cb);
            apis.getAllDevIds({ ncName: [] }, cb);
            apis.getAllDevIds({ ncName: NaN }, cb);
            apis.getAllDevIds({ ncName: new Date() }, cb);
            apis.getAllDevIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getAllGadIds', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.getAllGadIds({ ncName: 1 }, cb);
            apis.getAllGadIds({ ncName: {} }, cb);
            apis.getAllGadIds({ ncName: [] }, cb);
            apis.getAllGadIds({ ncName: NaN }, cb);
            apis.getAllGadIds({ ncName: new Date() }, cb);
            apis.getAllGadIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getDevs', function() {
        it('should has error if args.ids is not an array of number or string', function (done) {
            var errMsg = 'ids should be an array of number or string',
                cb = getCheckedCb(7, errMsg, done);

            apis.getDevs({ ids: 1 }, cb);
            apis.getDevs({ ids: {} }, cb);
            apis.getDevs({ ids: NaN }, cb);
            apis.getDevs({ ids: new Date() }, cb);
            apis.getDevs({ ids: function () {} }, cb);
            apis.getDevs({ ids: null }, cb);
            apis.getDevs({ ids: undefined }, cb);
        });
    });

    describe('#.getGads', function() {
        it('should has error if args.ids is not an array of number or string', function (done) {
            var errMsg = 'ids should be an array of number or string',
                cb = getCheckedCb(7, errMsg, done);

            apis.getGads({ ids: 1 }, cb);
            apis.getGads({ ids: {} }, cb);
            apis.getGads({ ids: NaN }, cb);
            apis.getGads({ ids: new Date() }, cb);
            apis.getGads({ ids: function () {} }, cb);
            apis.getGads({ ids: null }, cb);
            apis.getGads({ ids: undefined }, cb);
        });
    });

    describe('#.getNetcores', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.getAllGadIds({ ncName: 1 }, cb);
            apis.getAllGadIds({ ncName: {} }, cb);
            apis.getAllGadIds({ ncName: [] }, cb);
            apis.getAllGadIds({ ncName: NaN }, cb);
            apis.getAllGadIds({ ncName: new Date() }, cb);
            apis.getAllGadIds({ ncName: function () {} }, cb);
        });
    });

    describe('#.getBlacklist', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.getBlacklist({ ncName: 1 }, cb);
            apis.getBlacklist({ ncName: {} }, cb);
            apis.getBlacklist({ ncName: [] }, cb);
            apis.getBlacklist({ ncName: NaN }, cb);
            apis.getBlacklist({ ncName: new Date() }, cb);
            apis.getBlacklist({ ncName: function () {} }, cb);
            apis.getBlacklist({ ncName: null }, cb);
            apis.getBlacklist({ ncName: undefined }, cb);
        });
    });

    describe('#.permitJoin', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.permitJoin({ ncName: 1, duration: 180 }, cb);
            apis.permitJoin({ ncName: {}, duration: 180 }, cb);
            apis.permitJoin({ ncName: [], duration: 180 }, cb);
            apis.permitJoin({ ncName: NaN, duration: 180 }, cb);
            apis.permitJoin({ ncName: new Date(), duration: 180 }, cb);
            apis.permitJoin({ ncName: function () {}, duration: 180 }, cb);
        });

        it('should has error if args.duration is not a number', function (done) {
            var errMsg = 'duration should be a number',
                cb = getCheckedCb(7, errMsg, done);

            apis.permitJoin({ ncName: 'zCore', duration: '1' }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: {} }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: [] }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: null }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: undefined }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: new Date() }, cb);
            apis.permitJoin({ ncName: 'zCore', duration: function () {} }, cb);
        });
    });

    describe('#.reset', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.reset({ ncName: 1, mode: 0 }, cb);
            apis.reset({ ncName: {}, mode: 0 }, cb);
            apis.reset({ ncName: [], mode: 0 }, cb);
            apis.reset({ ncName: NaN, mode: 0 }, cb);
            apis.reset({ ncName: new Date(), mode: 0 }, cb);
            apis.reset({ ncName: function () {}, mode: 0 }, cb);
        });

        it('should has error if args.mode is not a number', function (done) {
            var errMsg = 'mode only accepts 0 or 1',
                cb = getCheckedCb(7, errMsg, done);

            apis.reset({ ncName: 'zCore', mode: '1' }, cb);
            apis.reset({ ncName: 'zCore', mode: {} }, cb);
            apis.reset({ ncName: 'zCore', mode: [] }, cb);
            apis.reset({ ncName: 'zCore', mode: null }, cb);
            apis.reset({ ncName: 'zCore', mode: undefined }, cb);
            apis.reset({ ncName: 'zCore', mode: new Date() }, cb);
            apis.reset({ ncName: 'zCore', mode: function () {} }, cb);
        });
    });

    describe('#.enable', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.enable({ ncName: 1 }, cb);
            apis.enable({ ncName: {} }, cb);
            apis.enable({ ncName: [] }, cb);
            apis.enable({ ncName: NaN }, cb);
            apis.enable({ ncName: new Date() }, cb);
            apis.enable({ ncName: function () {} }, cb);
        });
    });

    describe('#.disable', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.disable({ ncName: 1 }, cb);
            apis.disable({ ncName: {} }, cb);
            apis.disable({ ncName: [] }, cb);
            apis.disable({ ncName: NaN }, cb);
            apis.disable({ ncName: new Date() }, cb);
            apis.disable({ ncName: function () {} }, cb);
        });
    });

    describe('#.ban', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.ban({ ncName: 1, permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: {}, permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: [], permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: NaN, permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: null, permAddr: '0x123456789' }, cb);
            apis.ban({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.ban({ ncName: 'zCore', permAddr: 1 }, cb);
            apis.ban({ ncName: 'zCore', permAddr: {} }, cb);
            apis.ban({ ncName: 'zCore', permAddr: [] }, cb);
            apis.ban({ ncName: 'zCore', permAddr: NaN }, cb);
            apis.ban({ ncName: 'zCore', permAddr: new Date() }, cb);
            apis.ban({ ncName: 'zCore', permAddr: function () {} }, cb);
            apis.ban({ ncName: 'zCore', permAddr: null }, cb);
            apis.ban({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.unban', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.unban({ ncName: 1, permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: {}, permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: [], permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: NaN, permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: null, permAddr: '0x123456789' }, cb);
            apis.unban({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.unban({ ncName: 'zCore', permAddr: 1 }, cb);
            apis.unban({ ncName: 'zCore', permAddr: {} }, cb);
            apis.unban({ ncName: 'zCore', permAddr: [] }, cb);
            apis.unban({ ncName: 'zCore', permAddr: NaN }, cb);
            apis.unban({ ncName: 'zCore', permAddr: new Date() }, cb);
            apis.unban({ ncName: 'zCore', permAddr: function () {} }, cb);
            apis.unban({ ncName: 'zCore', permAddr: null }, cb);
            apis.unban({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.remove', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.remove({ ncName: 1, permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: {}, permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: [], permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: NaN, permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: null, permAddr: '0x123456789' }, cb);
            apis.remove({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.remove({ ncName: 'zCore', permAddr: 1 }, cb);
            apis.remove({ ncName: 'zCore', permAddr: {} }, cb);
            apis.remove({ ncName: 'zCore', permAddr: [] }, cb);
            apis.remove({ ncName: 'zCore', permAddr: NaN }, cb);
            apis.remove({ ncName: 'zCore', permAddr: new Date() }, cb);
            apis.remove({ ncName: 'zCore', permAddr: function () {} }, cb);
            apis.remove({ ncName: 'zCore', permAddr: null }, cb);
            apis.remove({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.ping', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.ping({ ncName: 1, permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: {}, permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: [], permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: NaN, permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: new Date(), permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: function () {}, permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: null, permAddr: '0x123456789' }, cb);
            apis.ping({ ncName: undefined, permAddr: '0x123456789' }, cb);
        });

        it('should has error if args.permAddr is not a string', function (done) {
            var errMsg = 'permAddr should be a string',
                cb = getCheckedCb(8, errMsg, done);

            apis.ping({ ncName: 'zCore', permAddr: 1 }, cb);
            apis.ping({ ncName: 'zCore', permAddr: {} }, cb);
            apis.ping({ ncName: 'zCore', permAddr: [] }, cb);
            apis.ping({ ncName: 'zCore', permAddr: NaN }, cb);
            apis.ping({ ncName: 'zCore', permAddr: new Date() }, cb);
            apis.ping({ ncName: 'zCore', permAddr: function () {} }, cb);
            apis.ping({ ncName: 'zCore', permAddr: null }, cb);
            apis.ping({ ncName: 'zCore', permAddr: undefined }, cb);
        });
    });

    describe('#.maintain', function() {
        it('should has error if args.ncName is not a string', function (done) {
            var errMsg = 'ncName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            apis.maintain({ ncName: 1 }, cb);
            apis.maintain({ ncName: {} }, cb);
            apis.maintain({ ncName: [] }, cb);
            apis.maintain({ ncName: NaN }, cb);
            apis.maintain({ ncName: new Date() }, cb);
            apis.maintain({ ncName: function () {} }, cb);
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
