var fs = require('fs'),
    path = require('path');

var _ = require('busyman'),
    expect = require('chai').expect;

var Freebird = require('../index');

var fakeNc = {
        _freebird: {},
        _controller: {},
        getName: function () { return 'fakeNc1'; },
        start: function () {}, 
        stop: function () {},  
        reset: function () {},  
        permitJoin: function () {}, 
        remove: function () {},  
        ban: function () {}, 
        unban: function () {}, 
        ping: function () {}, 
        maintain: function () {}
    },
    fbWithNc = new Freebird([fakeNc], { dbPaths: {
        device: path.resolve(__dirname, '../database/testDevices.db'), 
        gadget: path.resolve(__dirname, '../database/testGadgets.db')
    }});

describe('freebird - Constructor Check', function () {
    describe('Freebird Constructor', function () {
        it('#No Arg', function () {
            expect(function () { return new Freebird(); }).to.throw(Error);  
            // throw TypeError 'TypeError: Element of index 0 is not a valid netcore'
        });

        it('#netcores', function () {
            expect(function () { return new Freebird([fakeNc]); }).not.to.throw(Error);
        });

        it('#netcores, options', function () {
            expect(function () { return new Freebird([fakeNc], {maxDevNum: 30, maxGadNum: 10}); }).to.throw(Error);
        });

        it('Base Property Check', function () {
            expect(fbWithNc._netcores[0]).to.be.equal(fakeNc);
            // _devbox, _gadbox, _apiAgent
        });
    });
});

describe('freebird - Signature Check', function () {
    describe('#addTransport(name, transp, callback)', function () {
        it('should throw if name is not a string', function () {
            expect(function () { return fbWithNc.addTransport(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.addTransport([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.addTransport(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.addTransport(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.addTransport(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.addTransport(function () {}); }).to.throw(TypeError);
        });

        it('should not throw if name is a string', function () {            
            expect(function () { return fbWithNc.addTransport('xxx'); }).not.to.throw(TypeError);
        });

        it('should has error if transp is not a transp', function (done) {  
            var cb = getCheckedCb(7, done);

            fbWithNc.addTransport('xxx', 1, cb);
            fbWithNc.addTransport('xxx', 'yyy', cb);
            fbWithNc.addTransport('xxx', [], cb);
            fbWithNc.addTransport('xxx', null, cb);
            fbWithNc.addTransport('xxx', NaN, cb);
            fbWithNc.addTransport('xxx', true, cb);
            fbWithNc.addTransport('xxx', function () {}, cb);
        });
    });

    describe('#findById(type, id)', function () {
        it('should throw if type is unknow', function () {           
            expect(function () { return fbWithNc.findById(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findById(function () {}); }).to.throw(TypeError);
        });

        it('should throw if type is know', function () {            
            expect(function () { return fbWithNc.findById('netcore'); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.findById('device'); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.findById('gadget'); }).not.to.throw(TypeError);
        });

        // id don't check
    });

    describe('#findByNet(type, ncName, permAddr, auxId)', function () {
        it('should throw if type is unknow', function () {
            expect(function () { return fbWithNc.findByNet(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet(function () {}); }).to.throw(TypeError);
        });

        it('should throw if type is know', function () {            
            expect(function () { return fbWithNc.findByNet('netcore'); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet('device'); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.findByNet('gadget'); }).not.to.throw(TypeError);
        });

        // ncName, permAddr, auxId don't check
    });

    describe('#filter(type, pred)', function () {
        it('should throw if type is unknow', function () {            
            expect(function () { return fbWithNc.filter(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter(function () {}); }).to.throw(TypeError);
        });

        it('should throw if pred is not a function', function () {
            expect(function () { return fbWithNc.filter('device', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', true); }).to.throw(TypeError);
        });

        it('should not throw if type is know and pred is a function', function () {  
            expect(function () { return fbWithNc.filter('netcore', function () {}); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.filter('device', function () {}); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.filter('gadget', function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#register(type, obj, callback)', function () {
        it('should has error if type is unknow', function (done) {  
            var cb = getCheckedCb(7, done);

            fbWithNc.register(1, {}, cb);
            fbWithNc.register('xxx', {}, cb);
            fbWithNc.register([], {}, cb);
            fbWithNc.register(null, {}, cb);
            fbWithNc.register(NaN, {}, cb);
            fbWithNc.register(true, {}, cb);
            fbWithNc.register(function () {}, {}, cb);
        });

        it('should has error if obj is not a object', function (done) {  
            var cb = getCheckedCb(7, done);

            fbWithNc.register('device', 1, cb);
            fbWithNc.register('device', 'xxx', cb);
            fbWithNc.register('device', [], cb);
            fbWithNc.register('device', null, cb);
            fbWithNc.register('device', NaN, cb);
            fbWithNc.register('device', true, cb);
            fbWithNc.register('device', function () {}, cb);
        });
    });

    describe('#unregister(type, obj, callback)', function () {
        it('should has error if type is unknow', function (done) {  
            var cb = getCheckedCb(7, done);

            fbWithNc.unregister(1, {}, cb);
            fbWithNc.unregister('xxx', {}, cb);
            fbWithNc.unregister([], {}, cb);
            fbWithNc.unregister(null, {}, cb);
            fbWithNc.unregister(NaN, {}, cb);
            fbWithNc.unregister(true, {}, cb);
            fbWithNc.unregister(function () {}, {}, cb);
        });

        it('should has error if obj is not a object', function (done) {  
            var cb = getCheckedCb(7, done);

            fbWithNc.unregister('device', 1, cb);
            fbWithNc.unregister('device', 'xxx', cb);
            fbWithNc.unregister('device', [], cb);
            fbWithNc.unregister('device', null, cb);
            fbWithNc.unregister('device', NaN, cb);
            fbWithNc.unregister('device', true, cb);
            fbWithNc.unregister('device', function () {}, cb);
        });
    });

    describe('#start(callback)', function () {
        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.start(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.start('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.start([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.start(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.start(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.start(true); }).to.throw(TypeError);
        });

        it('should not throw if callback is a function', function () {
            expect(function () { return fbWithNc.start(function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#stop(callback)', function () {
        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.stop(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.stop('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.stop([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.stop(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.stop(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.stop(true); }).to.throw(TypeError);
        });

        it('should not throw if callback is a function', function () {
            expect(function () { return fbWithNc.stop(function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#reset(mode, callback)', function () {
        it('should throw if mode is unknow', function () {
            expect(function () { return fbWithNc.reset(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(function () {}); }).to.throw(TypeError);
        });

        it('should not throw if mode is know', function () {            
            expect(function () { return fbWithNc.reset(0); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.reset(1); }).not.to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.reset(0, 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(0, 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(0, []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(0, null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(0, NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.reset(0, true); }).to.throw(TypeError);
        });

        it('should not throw if callback is a function', function () {
            expect(function () { return fbWithNc.reset(0, function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#permitJoin(duration, callback)', function () {
        it('should throw if duration is not a number', function () {
            expect(function () { return fbWithNc.permitJoin('xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(function () {}); }).to.throw(TypeError);
        });

        it('should not throw if duration is a number', function () {            
            expect(function () { return fbWithNc.permitJoin(10); }).not.to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.permitJoin(30, 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(30, 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(30, []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(30, null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(30, NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.permitJoin(30, true); }).to.throw(TypeError);
        });

        it('should not throw if callback is a function', function () {
            expect(function () { return fbWithNc.permitJoin(30, function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#remove(ncName, permAddr, callback)', function () {
        it('should throw if ncName is not a string', function () {
            expect(function () { return fbWithNc.remove(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove(function () {}); }).to.throw(TypeError);
        });

        it('should throw if permAddr is not a string', function () {
            expect(function () { return fbWithNc.remove('xxx', 10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', function () {}); }).to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.remove('xxx', 'yyy', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', 'yyy', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', 'yyy', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', 'yyy', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', 'yyy', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.remove('xxx', 'yyy', true); }).to.throw(TypeError);
        });

        it('should not throw if ncName and permAddr is a string, callback is a function', function () {
            expect(function () { return fbWithNc.remove('xxx', 'yyy', function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#ban(ncName, permAddr, callback)', function () {
        it('should throw if ncName is not a string', function () {
            expect(function () { return fbWithNc.ban(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban(function () {}); }).to.throw(TypeError);
        });

        it('should throw if permAddr is not a string', function () {
            expect(function () { return fbWithNc.ban('xxx', 10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', function () {}); }).to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.ban('xxx', 'yyy', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', 'yyy', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', 'yyy', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', 'yyy', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', 'yyy', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ban('xxx', 'yyy', true); }).to.throw(TypeError);
        });

        it('should not throw if ncName and permAddr is a string, callback is a function', function () {
            expect(function () { return fbWithNc.ban('xxx', 'yyy', function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#unban(ncName, permAddr, callback)', function () {
        it('should throw if ncName is not a string', function () {
            expect(function () { return fbWithNc.unban(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban(function () {}); }).to.throw(TypeError);
        });

        it('should throw if permAddr is not a string', function () {
            expect(function () { return fbWithNc.unban('xxx', 10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', function () {}); }).to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.unban('xxx', 'yyy', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', 'yyy', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', 'yyy', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', 'yyy', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', 'yyy', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.unban('xxx', 'yyy', true); }).to.throw(TypeError);
        });

        it('should not throw if ncName and permAddr is a string, callback is a function', function () {
            expect(function () { return fbWithNc.unban('xxx', 'yyy', function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#ping(ncName, permAddr, callback)', function () {
        it('should throw if ncName is not a string', function () {
            expect(function () { return fbWithNc.ping(10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping(null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping(true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping(function () {}); }).to.throw(TypeError);
        });

        it('should throw if permAddr is not a string', function () {
            expect(function () { return fbWithNc.ping('xxx', 10); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', true); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', function () {}); }).to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.ping('xxx', 'yyy', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', 'yyy', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', 'yyy', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', 'yyy', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', 'yyy', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.ping('xxx', 'yyy', true); }).to.throw(TypeError);
        });

        it('should not throw if ncName and permAddr is a string, callback is a function', function () {
            expect(function () { return fbWithNc.ping('xxx', 'yyy', function () {}); }).not.to.throw(TypeError);
        });
    });

    describe('#maintain(ncName, callback)', function () {
        it('should throw if duration is not a string or null if given', function () {
            expect(function () { return fbWithNc.maintain(1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain([]); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain(NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain(true); }).to.throw(TypeError);
        });

        it('should not throw if duration is a string, null or not given', function () {            
            expect(function () { return fbWithNc.maintain(); }).not.to.throw(TypeError);
            expect(function () { return fbWithNc.maintain(null); }).not.to.throw(TypeError);  // need to check
            expect(function () { return fbWithNc.maintain('fakeNc1'); }).not.to.throw(TypeError);
        });

        it('should throw if callback is not a function', function () {
            expect(function () { return fbWithNc.maintain('fakeNc1', 1); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain('fakeNc1', 'xxx'); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain('fakeNc1', []); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain('fakeNc1', null); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain('fakeNc1', NaN); }).to.throw(TypeError);
            expect(function () { return fbWithNc.maintain('fakeNc1', true); }).to.throw(TypeError);
        });

        it('should not throw if callback is a function', function () {
            expect(function () { return fbWithNc.maintain('fakeNc1', function () {}); }).not.to.throw(TypeError);
        });
    });
});

function getCheckedCb (times, done) {
    var checkNum = 0,
        cbCalled = false;

    return function (err) {
        if (err && (err instanceof TypeError))
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
