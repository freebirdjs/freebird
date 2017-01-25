var fs = require('fs'),
    path = require('path');

var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    FbConst = require('freebird-constants');

chai.use(sinonChai);

var loader = require('../lib/components/loader');
    Freebird = require('../index'),
    Constants = require('../lib/utils/constants'),
    FB_STATE = Constants.FB_STATE,
    EVT_TOP = FbConst.EVENTS_TO_TOP;

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
        maintain: function () {},
        _setState: function (state) { this._state = state; },
        _getState: function (state) { return this._state; }
    },
    fakeNc2 = {
        _freebird: {},
        _controller: {},
        getName: function () { return 'fakeNc2'; },
        start: function () {}, 
        stop: function () {},  
        reset: function () {},  
        permitJoin: function () {}, 
        remove: function () {},  
        ban: function () {}, 
        unban: function () {}, 
        ping: function () {}, 
        maintain: function () {},
        _setState: function (state) { this._state = state; },
        _getState: function (state) { return this._state; }
    },
    fb = new Freebird([fakeNc], { dbPaths: {
        device: path.resolve(__dirname, '../database/testDevices1.db'), 
        gadget: path.resolve(__dirname, '../database/testGadgets1.db')
    }}),
    fbMultiNc = new Freebird([fakeNc, fakeNc2], { dbPaths: {
        device: path.resolve(__dirname, '../database/testDevices2.db'), 
        gadget: path.resolve(__dirname, '../database/testGadgets2.db')
    }}),
    fakeGetFunc = function (name) {
        switch (name) {
            case 'netcore':
                return fakeNc;

            case 'permAddr':
                return '00:00:00:00:00';

            case 'auxId':
                return 'aa/bb';

            case 'id':
                return this._id;

            case 'device':
                return fakeDev;

            case 'gadTable':
                return this._gads;

        }
    },
    fakeSetFunc = function (name, value) {
        switch (name) {
            case '_id':
                this._id = value;
                break;
        }
    },
    fakeDev = {
        _netcore: {},
        _id: 1,
        _recovering: false,
        _poke: function () {},
        _gads: [],
        get: fakeGetFunc,
        set: fakeSetFunc,
        ping: function () {},
        dump: function () {
            return {
                netcore: 'fakeNc1',
                id: this._id,
                gads: this._gads,
                net: { address: { permanent: '00:00:00:00:00' }}
            };
        }
    },
    fakeGad = {
        _id: 1,
        _auxId: 'aa/bb',
        _dev: fakeDev,
        _recovering: false,
        _clear: function () {},
        disable: function () {},
        get: fakeGetFunc,
        set: fakeSetFunc,
        dump: function () {
            return {
                netcore: 'fakeNc1',
                id: this._id,
                auxId: this._auxId,
                dev: {
                    id: fakeDev._id,
                    permAddr: '00:00:00:00:00'
                }
            };
        }
    };

describe('freebird - Functional Check', function () {
    describe('#findById(type, id)', function () {
        before(function(done) {
            fakeDev._recovering = false;
            fb.register('device', fakeDev, function (err, id) {
                fakeGad._recovering = false;
                fb.register('gadget', fakeGad, function (err, id) {
                    done();
                });
            });
        });

        it('should find netcore by id', function (done) {
            if (fb.findById('netcore', 'fakeNc1') === fakeNc)
                done();
        });

        it('should find device by id', function (done) {
            if (fb.findById('device', 1) === fakeDev)
                 done();
        });        

        it('should find gadget by id', function (done) {
            if (fb.findById('gadget', 1) === fakeGad)
                 done();
        });
    });

    describe('#findByNet(type, ncName, permAddr, auxId)', function () {
        it('should find netcore by ncName', function (done) {
            if (fb.findByNet('netcore', 'fakeNc1') === fakeNc)
                done();
        });

        it('should find device by permAddr', function (done) {
            if (fb.findByNet('device', 'fakeNc1', '00:00:00:00:00') === fakeDev)
                done();
        });        

        it('should find gadget by auxId', function (done) {
            if (fb.findByNet('gadget', 'fakeNc1', '00:00:00:00:00', 'aa/bb') === fakeGad)
                done();
        });
    });

    describe('#filter(type, pred)', function () {
        it('should filter netcore by pred', function (done) {
            var nc = fb.filter('netcore', function (nc) { 
                    return nc.getName() === 'fakeNc1'; 
                })[0];

            if (nc === fakeNc)
                done();
        });

        it('should filter device by pred', function (done) {
            var dev = fb.filter('device', function (dev) { 
                    return dev._id === 1; 
                })[0];
            
            if (dev === fakeDev)
                done();
        });        

        it('should filter gadget by pred', function (done) {
            var gad = fb.filter('gadget', function (gad) { 
                    return gad._id === 1; 
                })[0];
            
            if (gad === fakeGad)
                done();
        });

        after(function(done) {            
            fb.unregister('gadget', fakeGad, function (err, id) {
                fb.unregister('device', fakeDev, function (err, id) {
                    done();
                });
            });
        });
    });

    describe('#register(type, obj, callback)', function () {
        it('should register device with recovering false', function (done) {
            fakeDev._poke = sinon.spy();
            fakeDev._recovering = false;
            fb.register('device', fakeDev, function (err, id) {
                if (id === fakeDev._id) {
                    expect(fakeDev._poke).to.have.been.calledOnce;
                    expect(fb.findById('device', 1)).to.be.equal(fakeDev);
                    fb.unregister('device', fakeDev, function (err, id) { 
                        done();
                    });
                }
            });
        });

        it('should register device with recovering true', function (done) {
            fakeDev._recovering = true;
            fb.register('device', fakeDev, function (err, id) {
                if (id === fakeDev._id && fakeDev._recovering === false) {
                    done();
                }
            });
        });

        it('should register gadget with recovering false', function (done) {
            fakeGad._recovering = false;
            fb.register('gadget', fakeGad, function (err, id) {
                if (id === fakeGad._id && fakeDev._gads.length !== 0) {
                    fb.unregister('gadget', fakeGad, function (err, id) { 
                        done();
                    });
                }
            });
        });

        it('should register gadget with recovering true', function (done) {
            fakeGad._recovering = true;
            fb.register('gadget', fakeGad, function (err, id) {
                if (id === fakeGad._id && fakeDev._recovering === false) {
                    done();
                }
            });
        });
    });

    describe('#unregister(type, obj, callback)', function () {
        it('should register device', function (done) {
            fb.unregister('device', fakeDev, function (err, id) {
                if (!fb.findById('device', 1))
                    done();
            });
        });

        it('should register gadget', function (done) {
            fb.unregister('gadget', fakeGad, function (err, id) {
                if (!fb.findById('gadget', 1))
                    done();
            });
        });
    });

    describe('#start(callback)', function () {
        it('should start netcore and not thing reload', function (done) {
            var startStub = sinon.stub(fakeNc, 'start', function (callback) {   
                    if (_.isFunction(callback)) {                             
                        startStub.restore();
                        expect(fb.findById('device', 1)).to.be.equal(undefined);
                        callback();
                    }
                });

            fb._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.UNKNOW;

            fb.start(function (err) {
                done();
            });
        });

        it('should start netcore and some thing reload', function (done) {
            var devFindFromDbStub = sinon.stub(fb._devbox, 'findFromDb', function (obj, callback) {  
                    callback(null, [{"netcore":"fakeNc1","id":10,"gads":[{"gadId":10,"auxId":"aa/cc"}],"net":{"address":{"permanent":"00:00:00:00:01"}}, "attrs": {}, "props": {}, "_id":"eD3Tg3iGOZJQgfjZ"}]);
                }),
                gadFindFromDbStub = sinon.stub(fb._gadbox, 'findFromDb', function (obj, callback) {  
                    callback(null, [{"netcore":"fakeNc1","id":10,"auxId":"aa/cc","dev":{"id":10,"permAddr":"00:00:00:00:01"}, "attrs": {}, "props": {}, "panel": {},"_id":"tUmqSZCXgvC5Fc6u"}]);
                }),
                startStub = sinon.stub(fakeNc, 'start', function (callback) {    
                    if (_.isFunction(callback) && fb.findById('device', 10)) {                              
                        startStub.restore();
                        devFindFromDbStub.restore();
                        gadFindFromDbStub.restore();
                        callback();
                    }
                });

            fb._state = FB_STATE.UNKNOW;
            fakeNc._state = FB_STATE.UNKNOW;

            fb.start(function (err) {
                done();
            });
        });

        // it('should start multi netcore', function (done) {
        //     var startStub = sinon.stub(fakeNc, 'start', function (callback) {  
        //             if (_.isFunction(callback)) {                              
        //                 startStub.restore();
        //                 expect(fb.findById('device', 1)).to.be.equal(undefined);
        //                 callback();
        //             }
        //         }),
        //         startStub2 = sinon.stub(fakeNc2, 'start', function (callback) {    

        //             if (_.isFunction(callback)) {                              
        //                 startStub2.restore();
        //                 expect(fb.findById('device', 1)).to.be.equal(undefined);
        //                 callback();
        //             }
        //         });

        //     fb._state = FB_STATE.NORMAL;
        //     fakeNc._state = FB_STATE.UNKNOW;
        //     fakeNc2._state = FB_STATE.UNKNOW;

        //     fbMultiNc.start(function (err) {
        //         done();
        //     });
        // });

        it('should start success and change state from unknow to normal', function (done) {
            // unknow
            var devFindFromDbSpy = sinon.spy(fbMultiNc._devbox, 'findFromDb'),
                gadFindFromDbSpy = sinon.spy(fbMultiNc._gadbox, 'findFromDb'),
                startStub = sinon.stub(fakeNc, 'start', function (callback) {    
                    callback();
                }),
                startStub2 = sinon.stub(fakeNc2, 'start', function (callback) {    
                    callback();
                }),
                maintainSpy = sinon.spy(fbMultiNc, 'maintain'),
                emitSpy = sinon.spy(fbMultiNc, 'emit');

            fbMultiNc._state = FB_STATE.UNKNOW;
            fakeNc._state = FB_STATE.UNKNOW;
            fakeNc2._state = FB_STATE.UNKNOW;

            fbMultiNc.start(function () {
                expect(devFindFromDbSpy).to.be.calledTwice;
                expect(gadFindFromDbSpy).to.be.calledTwice;
                expect(startStub).to.be.calledOnce;
                expect(startStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(maintainSpy).to.be.calledOnce;
                expect(emitSpy).to.be.calledWith(EVT_TOP.READY);

                devFindFromDbSpy.restore();
                gadFindFromDbSpy.restore();
                startStub.restore();
                startStub2.restore();
                maintainSpy.restore();
                emitSpy.restore();

                done();
            });
        });

        it('should fail if one netcore start fails', function (done) {
            // unknow
            var devFindFromDbSpy = sinon.spy(fbMultiNc._devbox, 'findFromDb'),
                gadFindFromDbSpy = sinon.spy(fbMultiNc._gadbox, 'findFromDb'),
                startStub = sinon.stub(fakeNc, 'start', function (callback) {    
                    callback(new Error('error'));
                }),
                startStub2 = sinon.stub(fakeNc2, 'start', function (callback) {    
                    callback();
                }),
                stopStub2 = sinon.stub(fakeNc2, 'stop', function (callback) {
                    callback();
                });

            fbMultiNc._state = FB_STATE.UNKNOW;

            fbMultiNc.start(function (err) {
                expect(devFindFromDbSpy).to.be.calledTwice;
                expect(gadFindFromDbSpy).to.be.calledTwice;
                expect(startStub).to.be.calledOnce;
                expect(stopStub2).to.be.calledOnce;
                expect(startStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.UNKNOW);
                expect(err.message).to.be.equal('fakeNc1 netcore start failed with error: error');

                devFindFromDbSpy.restore();
                gadFindFromDbSpy.restore();
                startStub.restore();
                stopStub2.restore();
                startStub2.restore();

                done();
            });
        });

        it('should return error if all netcore are started', function (done) {
            // normal
            fbMultiNc._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.NORMAL;
            fakeNc2._state = FB_STATE.NORMAL;

            fbMultiNc.start(function (err) {
                expect(err.message).to.be.equal('All netcores have been started');
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);

                done();
            });
        });

        it('should only start the stopped netcore and start success', function (done) {
            // normal
            var startStub = sinon.stub(fakeNc, 'start', function (callback) {    
                    callback();
                }),
                startStub2 = sinon.stub(fakeNc2, 'start', function (callback) {    
                    callback();
                }),
                maintainSpy = sinon.spy(fbMultiNc, 'maintain');

            fbMultiNc._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.UNKNOW;
            fakeNc2._state = FB_STATE.NORMAL;

            fbMultiNc.start(function (err) {
                expect(startStub).to.be.calledOnce;
                expect(startStub2).to.be.callCount(0);
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(maintainSpy).to.be.calledOnce;

                startStub.restore();
                startStub2.restore();
                maintainSpy.restore();

                done();
            });
        });

        it('should only start the stopped netcore and start fail', function (done) {
            // normal
            var startStub = sinon.stub(fakeNc, 'start', function (callback) {    
                    callback(new Error('error'));
                }),
                startStub2 = sinon.stub(fakeNc2, 'start', function (callback) {    
                    callback();
                }),
                stopStub2 = sinon.stub(fakeNc2, 'stop', function (callback) {    
                    callback();
                });

            fbMultiNc._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.UNKNOW;
            fakeNc2._state = FB_STATE.UNKNOW;

            fbMultiNc.start(function (err) {
                expect(startStub2).to.be.calledOnce;
                expect(startStub).to.be.calledOnce;
                expect(stopStub2).to.be.callCount(0);
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(err.message).to.be.equal('fakeNc1 netcore start failed with error: error');

                startStub2.restore();
                startStub.restore();
                stopStub2.restore();

                done();
            });
        });
    });

    describe('#stop(callback)', function () {
        it('should stop netcore', function (done) {
            var stopStub = sinon.stub(fakeNc, 'stop', function (callback) {   
                    if (_.isFunction(callback)) {                 
                        stopStub.restore();
                        done();
                    }
                });

            fb._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.NORMAL;

            fb.stop(function (err) {});
        });

        // it('should stop multi netcore', function (done) {
        //     var stopStub = sinon.stub(fakeNc, 'stop', function (callback) {   
        //             if (_.isFunction(callback)) {                 
        //                 stopStub.restore();  
        //                 callback();
        //             }
        //         }),
        //         stopStub2 = sinon.stub(fakeNc2, 'stop', function (callback) {   
        //             if (_.isFunction(callback)) {                 
        //                 stopStub2.restore();  
        //                 callback();
        //             }
        //         });

        //     fbMultiNc.stop(function (err) {
        //         done();
        //     });
        // });

        it('should be error if freebird already stopped', function (done) {
            fbMultiNc._state = FB_STATE.UNKNOW;

            fbMultiNc.stop(function (err) {
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.UNKNOW);
                expect(err.message).to.be.equal('Freebird can not stop now');
                done();
            });
        });

        it('should only stop the started netcores and stop fails', function (done) {
            var stopStub = sinon.stub(fakeNc, 'stop', function (callback) {    
                    callback(new Error('error'));
                }),
                stopStub2 = sinon.stub(fakeNc2, 'stop', function (callback) {    
                    callback();
                });

            fbMultiNc._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.NORMAL;
            fakeNc2._state = FB_STATE.NORMAL;

            fbMultiNc.stop(function (err) {
                expect(stopStub).to.be.calledOnce;
                expect(stopStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(err.message).to.be.equal('fakeNc1 netcore stop failed with error: error');

                stopStub.restore();
                stopStub2.restore();

                done();
            });
        });

        it('should only stop the started netcores and stop success', function (done) {
            var stopStub = sinon.stub(fakeNc, 'stop', function (callback) {    
                    callback();
                }),
                stopStub2 = sinon.stub(fakeNc2, 'stop', function (callback) {    
                    callback();
                });

            fbMultiNc._state = FB_STATE.NORMAL;
            fakeNc._state = FB_STATE.UNKNOW;
            fakeNc2._state = FB_STATE.NORMAL;

            fbMultiNc.stop(function (err) {
                expect(stopStub).to.be.callCount(0);
                expect(stopStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.UNKNOW);

                stopStub.restore();
                stopStub2.restore();

                done();
            });
        });
    });

    describe('#reset(mode, callback)', function () {
        before(function(done) {
            fakeDev._recovering = false;
            fb.register('device', fakeDev, function (err, id) {
                fakeGad._recovering = false;
                fb.register('gadget', fakeGad, function (err, id) {
                    done();
                });
            });
        });

        it('should reset netcore with mode 0', function (done) {
            var resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    if (mode === 0 && _.isFunction(callback)) { 
                        resetStub.restore();
                        callback();
                    }
                });

            fb._state = FB_STATE.NORMAL;

            fb.reset(0, function (err) {
                expect(fb.findById('device', 1)).to.be.equal(fakeDev);
                expect(fb.findById('gadget', 1)).to.be.equal(fakeGad);
                done();
            });
        });

        it('should reset netcore with mode 1', function (done) {
            var resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    if (mode === 1 && _.isFunction(callback)) {     
                        resetStub.restore();
                        callback();
                    }
                });

            fb._state = FB_STATE.NORMAL;

            fb.reset(1, function (err) {
                expect(fb.findById('device', 1)).to.be.equal(undefined);
                expect(fb.findById('gadget', 1)).to.be.equal(undefined);
                done();
            });
        });

        // it('should reset multi netcore', function (done) {
        //     var resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
        //             if (mode === 0 && _.isFunction(callback)) {     
        //                 resetStub.restore();
        //                 callback();
        //             }
        //         }),
        //         resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) { 
        //             if (mode === 0 && _.isFunction(callback)) {     
        //                 resetStub2.restore();
        //                 callback();
        //             }
        //         });

        //     fbMultiNc.reset(0, function (err) {
        //         done();
        //     });
        // });

        it('should be error if call soft reset when freebird is stopped', function (done) {
            // unknow
            fbMultiNc._state = FB_STATE.UNKNOW;

            fbMultiNc.reset(0, function(err) {
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.UNKNOW);
                expect(err.message).to.be.equal('You can only hard reset when freebird is stopped');

                done();
            });
        });

        it('should hard reset error if one netcore reset fails when freebird is stopped', function (done) {
            // unknow
            var unloadByNcSpy = sinon.spy(loader, 'unloadByNetcore'),
                resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    callback(new Error('error'));
                }),
                resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) {   
                    callback();
                }),
                stopStub = sinon.stub(fakeNc2, 'stop', function (callback) {
                    callback();
                });

            fbMultiNc._state = FB_STATE.UNKNOW;

            fbMultiNc.reset(1, function (err) {
                expect(unloadByNcSpy).to.be.calledOnce;
                expect(unloadByNcSpy).to.be.calledWith(fbMultiNc, fakeNc2.getName());
                expect(resetStub).to.be.calledOnce;
                expect(resetStub2).to.be.calledOnce;
                expect(stopStub).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.UNKNOW);
                expect(err.message).to.be.equal('fakeNc1 netcore reset failed with error: error');

                unloadByNcSpy.restore();
                resetStub.restore();
                resetStub2.restore();
                stopStub.restore();

                done();
            });
        });

        it('should hard reset success when freebird is stopped', function (done) {
            // unknow
            var unloadByNcSpy = sinon.spy(loader, 'unloadByNetcore'),
                resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    callback();
                }),
                resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) {   
                    callback();
                }),
                fbEmitSpy = sinon.spy(fbMultiNc, 'emit');

            fbMultiNc._state = FB_STATE.UNKNOW;

            fbMultiNc.reset(1, function (err) {
                expect(unloadByNcSpy).to.be.calledTwice;
                expect(unloadByNcSpy).to.be.calledWith(fbMultiNc, fakeNc.getName());
                expect(unloadByNcSpy).to.be.calledWith(fbMultiNc, fakeNc2.getName());
                expect(resetStub).to.be.calledOnce;
                expect(resetStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(fbEmitSpy).to.be.calledOnce;
                expect(fbEmitSpy).to.be.calledWith(EVT_TOP.READY);

                unloadByNcSpy.restore();
                resetStub.restore();
                resetStub2.restore();
                fbEmitSpy.restore();

                done();
            });
        });

        it('should be error if one netcore reset fail when freebird is started', function (done) {
            // normal
            var resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    callback(new Error('error'));
                }),
                resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) {   
                    callback();
                });

            fbMultiNc._state = FB_STATE.NORMAL;

            fbMultiNc.reset(0, function (err) {
                expect(resetStub).to.be.calledOnce;
                expect(resetStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(err.message).to.be.equal('fakeNc1 netcore reset failed with error: error');

                resetStub.restore();
                resetStub2.restore();

                done();
            });
        });

        it('should soft reset success when freebird is started', function (done) {
            // normal
            var resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    callback();
                }),
                resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) {   
                    callback();
                }),
                fbEmitSpy = sinon.spy(fbMultiNc, 'emit');

            fbMultiNc._state = FB_STATE.NORMAL;

            fbMultiNc.reset(0, function (err) {
                expect(resetStub).to.be.calledOnce;
                expect(resetStub2).to.be.calledOnce;
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(fbEmitSpy).to.be.calledOnce;

                resetStub.restore();
                resetStub2.restore();
                fbEmitSpy.restore();

                done();
            });
        });

        it('should hard reset success when freebird is started', function (done) {
            // normal
            var unloadByNcSpy = sinon.spy(loader, 'unloadByNetcore'),
                resetStub = sinon.stub(fakeNc, 'reset', function (mode, callback) { 
                    callback();
                }),
                resetStub2 = sinon.stub(fakeNc2, 'reset', function (mode, callback) {   
                    callback();
                }),
                fbEmitSpy = sinon.spy(fbMultiNc, 'emit');

            fbMultiNc._state = FB_STATE.NORMAL;

            fbMultiNc.reset(1, function (err) {
                expect(resetStub).to.be.calledOnce;
                expect(resetStub2).to.be.calledOnce;
                expect(unloadByNcSpy).to.be.calledTwice;
                expect(unloadByNcSpy).to.be.calledWith(fbMultiNc, fakeNc.getName());
                expect(unloadByNcSpy).to.be.calledWith(fbMultiNc, fakeNc2.getName());
                expect(fbMultiNc._getState()).to.be.equal(FB_STATE.NORMAL);
                expect(fbEmitSpy).to.be.calledOnce;

                resetStub.restore();
                resetStub2.restore();
                fbEmitSpy.restore();

                done();
            });
        });

        after(function(done) {            
            fb.unregister('gadget', fakeGad, function (err, id) {
                fb.unregister('device', fakeDev, function (err, id) {
                    done();
                });
            });
        });
    });

    describe('#permitJoin(duration, callback)', function () {
        it('should set netcore permitJoin', function (done) {
            var permitJoinStub = sinon.stub(fakeNc, 'permitJoin', function (duration, callback) { 
                    if (duration === 30 && _.isFunction(callback)) {     
                        permitJoinStub.restore();
                        callback();
                    }
                });

            fb.permitJoin(30, function (err) {
                done();
            });
        });        

        it('should permitJoin multi netcore', function (done) {
            var permitJoinStub = sinon.stub(fakeNc, 'permitJoin', function (duration, callback) { 
                    if (duration === 30 && _.isFunction(callback)) {     
                        permitJoinStub.restore();
                        callback();
                    }
                }),
                permitJoinStub2 = sinon.stub(fakeNc2, 'permitJoin', function (duration, callback) { 
                    if (duration === 30 && _.isFunction(callback)) {     
                        permitJoinStub2.restore();
                        callback();
                    }
                });

            fbMultiNc.permitJoin(30, function (err) {
                done();
            });
        });
    });

    describe('#remove(ncName, permAddr, callback)', function () {
        it('should remove device', function (done) {
            var removeStub = sinon.stub(fakeNc, 'remove', function (permAddr, callback) { 
                    if (permAddr === '00:00:00:00:00' && _.isFunction(callback)) {     
                        removeStub.restore();
                        callback();
                    }
                });

            fb.remove('fakeNc1', '00:00:00:00:00', function (err) {
                done();
            });
        });

        it('should has error if netcore is not exist', function (done) {
            fb.remove('fakeNcxxx', '00:00:00:00:00', function (err) {
                if (err)
                    done();
            });
        });
    });

    describe('#ban(ncName, permAddr, callback)', function () {
        it('should ban device', function (done) {
            var banStub = sinon.stub(fakeNc, 'ban', function (permAddr, callback) { 
                    if (permAddr === '00:00:00:00:00' && _.isFunction(callback)) {     
                        banStub.restore();
                        callback();
                    }
                });

            fb.ban('fakeNc1', '00:00:00:00:00', function (err) {
                done();
            });
        });

        it('should has error if netcore is not exist', function (done) {
            fb.ban('fakeNcxxx', '00:00:00:00:00', function (err) {
                if (err)
                    done();
            });
        });
    });

    describe('#unban(ncName, permAddr, callback)', function () {
        it('should unban device', function (done) {
            var unbanStub = sinon.stub(fakeNc, 'unban', function (permAddr, callback) { 
                    if (permAddr === '00:00:00:00:00' && _.isFunction(callback)) {     
                        unbanStub.restore();
                        callback();
                    }
                });

            fb.unban('fakeNc1', '00:00:00:00:00', function (err) {
                done();
            });
        });

        it('should has error if netcore is not exist', function (done) {
            fb.unban('fakeNcxxx', '00:00:00:00:00', function (err) {
                if (err)
                    done();
            });
        });
    });

    describe('#ping(ncName, permAddr, callback)', function () {
          before(function(done) {
                fakeDev._recovering = true;
                fb.register('device', fakeDev, function (err, id) {
                    done();
                });
          });

        it('should ping device', function (done) {
            var pingStub = sinon.stub(fakeDev, 'ping', function (callback) { 
                    if (_.isFunction(callback)) {     
                        pingStub.restore();
                        callback();
                    }
                });

            fb.ping('fakeNc1', '00:00:00:00:00', function (err) {
                done();

            });
        });

        it('should has error if netcore is not exist', function (done) {
            fb.ping('fakeNcxxx', '00:00:00:00:00', function (err) {
                if (err)
                    done();
            });
        });

        it('should has error if device is not exist', function (done) {
            fb.ping('fakeNc1', '00:00:00:00:xx', function (err) {
                if (err)
                    done();
            });
        });

        after(function(done) {            
            fb.unregister('device', fakeDev, function (err, id) {
                done();
            });
        });
    });

    describe('#maintain(ncName, callback)', function () {
        it('should maintain netcore', function (done) {
            var maintainStub = sinon.stub(fakeNc, 'maintain', function (callback) { 
                    if (_.isFunction(callback)) {     
                        maintainStub.restore();
                        callback();
                    }
                });

            fb.maintain(function (err) {
                done();
            }); 
        });

        it('should maintain multi netcore with ncName', function (done) {
            var maintainStub = sinon.stub(fakeNc, 'maintain', function (callback) { 
                    if (_.isFunction(callback)) {     
                        maintainStub.restore();
                        callback();
                    }
                });

            fbMultiNc.maintain('fakeNc1', function (err) {
                done();
            }); 
        });

        it('should maintain multi netcore without ncName', function (done) {
            var maintainStub = sinon.stub(fakeNc, 'maintain', function (callback) { 
                    if (_.isFunction(callback)) {     
                        maintainStub.restore();
                        callback();
                    }
                }),
                maintainStub2 = sinon.stub(fakeNc2, 'maintain', function (callback) { 
                    if (_.isFunction(callback)) {     
                        maintainStub2.restore();
                        callback();
                    }
                });

            fbMultiNc.maintain(function (err) {
                done();
            }); 
        });
    });

    describe('#_fire(evt, data)', function () {
        it('should emit evt', function (done) {
            fb.on('testEvt', function (data) {
                if (data.result === 'test') 
                    done();
            });

            fb._fire('testEvt', { result: 'test'});
        });
    });    

    describe('#_tweet(subsys, indType, id, data)', function () {
        it('should _tweet net evt', function (done) {
            var indicateStub = sinon.stub(fb._apiAgent, 'indicate', function (ind) {
                    if (_.isEqual(ind, {__intf: 'IND', subsys: 0, type: 'test', id: 1, data: 'test'}))
                        indicateStub.restore();
                        done();
                });

            fb._tweet('net', 'test', 1, 'test');
        });

        it('should _tweet dev evt', function (done) {
            var indicateStub = sinon.stub(fb._apiAgent, 'indicate', function (ind) {
                    if (_.isEqual(ind, {__intf: 'IND', subsys: 1, type: 'test', id: 1, data: 'test'}))
                        indicateStub.restore();
                        done();
                });

            fb._tweet('dev', 'test', 1, 'test');
        });

        it('should _tweet gad evt', function (done) {
            var indicateStub = sinon.stub(fb._apiAgent, 'indicate', function (ind) {
                    if (_.isEqual(ind, {__intf: 'IND', subsys: 2, type: 'test', id: 1, data: 'test'}))
                        indicateStub.restore();
                        done();
                });

            fb._tweet('gad', 'test', 1, 'test');
        });
    });
});
