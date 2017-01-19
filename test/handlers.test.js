var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    _ = require('busyman'),
    FbConst = require('freebird-constants'),
    FBase = require('freebird-base');

chai.use(sinonChai);

var EVT_BTM = FbConst.EVENTS_FROM_BOTTOM,
    EVT_TOP = FbConst.EVENTS_TO_TOP,
    RPC = FbConst.RPC;

var netcore = FBase.createNetcore('fakeNc', {}, { phy: 'phy', nwk: 'nwk' });

var Freebird = require('../lib/freebird'),
    fb = new Freebird(netcore, {});


describe('Signature Check', function () {
    var unListenedEvts = [ EVT_BTM.NcGadLeaving, EVT_BTM.NcNetBan, EVT_BTM.NcNetUnban, 
            EVT_BTM.NcNetPing, EVT_BTM.DevRead, EVT_BTM.DevWrite, EVT_BTM.DevIdentify,
            EVT_BTM.GadRead, EVT_BTM.GadWrite, EVT_BTM.GadExec, EVT_BTM.GadReadReportCfg,
            EVT_BTM.GadWriteReportCfg, EVT_BTM.GadPanelChangedDisabled
    ];

    _.forEach(EVT_BTM, function (evName) {
        it('throw if freebird not listen ' + evName + ' event', function () {
            if (!_.includes(unListenedEvts, evName))
                expect(fb.listenerCount(evName)).to.be.equal(1);
        });        
    });
});

describe('Functional Check', function() {
    describe('#ncError', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx',
                error: new Error('An error occured.')
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcError, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.ERROR, msg.error.message);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'error', 0, { netcore: msg.ncName, message: msg.error.message });
            
            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncEnabled', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx'
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcEnabled, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.NC_ENABLED, msg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'enabled', 0, { netcore: msg.ncName });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncDisabled', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx'
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcDisabled, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.NC_DISABLED, msg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'disabled', 0, { netcore: msg.ncName });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncStarted', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx'
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcStarted, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.NC_STARTED, msg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'started', 0, { netcore: msg.ncName });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncStopped', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx'
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcStopped, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.NC_STOPPED, msg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'stopped', 0, { netcore: msg.ncName });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncReady', function () {
        // TODO
    });

    describe('#ncPermitJoin', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                ncName: 'xxx',
                timeLeft: 15
            };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcPermitJoin, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.NC_PERMIT_JOIN, msg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('net', 'permitJoining', 0, { netcore: msg.ncName, timeLeft: msg.timeLeft });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncDevIncoming', function () {
        var msg = {
                ncName: 'fakeNc',
                permAddr: '0x123456',
                raw: {}
            },
            cookRawDev =  function (devInst, rawDev, cb) {
                devInst.set('net', { address: { permanent: '0x123456', dynamic: 0} });
                cb(null, devInst);
            };

        it('should tweet net error if cookRawDev() is not implemented', function (done) {
            var tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcDevIncoming, msg);

            setImmediate(function () {
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('net', 'error', 0, { netcore: msg.ncName, message: '_cookRawDev() is not implemented' });
                tweetSpy.restore();
                done();
            });
        });

        it('should do nothing if netcore is not joinable', function (done) {
            netcore._cookRawDev = cookRawDev;

            var registerSpy = sinon.spy(fb, 'register');

            fb.emit(EVT_BTM.NcDevIncoming, msg);

            setImmediate(function () {
                expect(registerSpy).to.be.callCount(0);
                registerSpy.restore();
                done();
            });
        });

        it('should register a new device and emit devIncoming msg if netcore is joinable', function (done) {
            netcore._cookRawDev = cookRawDev;

            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                registerSpy = sinon.spy(fb, 'register'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcDevIncoming, msg);

            setTimeout(function () {
                var dev = fb.findByNet('device', msg.ncName, msg.permAddr);

                expect(isJoinableStub).to.be.calledOnce;
                expect(registerSpy).to.be.calledOnce;
                expect(registerSpy).to.be.calledWith('device', dev);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(
                    EVT_TOP.DEV_INCOMING, 
                    { ncName: msg.ncName, permAddr: msg.permAddr, id: dev.get('id'), device: dev }
                );
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'devIncoming', dev.get('id'));

                isJoinableStub.restore();
                registerSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 50);
        });

        it('should set divece info again and not emit event if device already exist', function (done) {
            netcore._cookRawDev = cookRawDev;

            var dev = fb.findByNet('device', msg.ncName, msg.permAddr),
                devPokeSpy = sinon.spy(dev, '_poke'),
                devSetSpy = sinon.spy(dev, 'set'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcDevIncoming, msg);

            setImmediate(function () {
                expect(devPokeSpy).to.be.calledOnce;
                expect(devSetSpy).to.be.callCount(5);
                expect(fireSpy).to.be.callCount(0);
                expect(tweetSpy).to.be.callCount(0);

                devPokeSpy.restore();
                devSetSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });
    });

    describe('#ncDevNetChanging', function () {
        it('should update device net info', function () {
            var msg = {
                ncName: 'fakeNc',
                permAddr: '0x123456',
                data: {
                    role: 'peripheral',
                    sleepPeriod: 0
                }
            },
            dev = fb.findByNet('device', msg.ncName, msg.permAddr),
            devSetSpy = sinon.spy(dev, 'set');

            fb.emit(EVT_BTM.NcDevNetChanging, msg);

            expect(devSetSpy).to.be.calledOnce;
            expect(devSetSpy).to.be.calledWith('net', msg.data);
            expect(dev.get('net').role).to.be.equal(msg.data.role);
            expect(dev.get('net').sleepPeriod).to.be.equal(msg.data.sleepPeriod);

            devSetSpy.restore();
        });
    });

    describe('#ncDevReporting', function () {
        it('shoeld update device attributes', function () {
            var msg = {
                ncName: 'fakeNc',
                permAddr: '0x123456',
                data: {
                    manufacturer: 'peripheral',
                    version: {
                        hw: 'v0.0.0',
                        sw: 'v0.0.0',
                        fw: 'v0.0.0'
                    }
                }
            },
            dev = fb.findByNet('device', msg.ncName, msg.permAddr),
            devPokeSpy = sinon.spy(dev, '_poke'),
            devSetSpy = sinon.spy(dev, 'set'),
            fireSpy = sinon.spy(fb, '_fire');

            fb.emit(EVT_BTM.NcDevReporting, msg);
            msg.id = dev.get('id');

            expect(devPokeSpy).to.be.calledOnce;
            expect(devSetSpy).to.be.callCount(3);
            expect(dev.get('attrs').manufacturer).to.be.equal(msg.data.manufacturer);
            expect(dev.get('attrs').version.hw).to.be.equal(msg.data.version.hw);
            expect(dev.get('attrs').version.fw).to.be.equal(msg.data.version.fw);
            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_REPORTING, msg);

            devPokeSpy.restore();
            devSetSpy.restore();
            fireSpy.restore();
        });
    });

    describe('#ncGadIncoming', function () {
        var msg = {
                ncName: 'fakeNc',
                permAddr: '0x123456',
                auxId: '123',
                raw: {}
            },
            cookRawGad =  function (gadInst, rawGad, cb) {
                gadInst._auxId = '123';
                cb(null, gadInst);
            };

        it('should tweet net error if cookRawGad() is not implemented', function (done) {
            var tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setImmediate(function () {
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('net', 'error', 0, { netcore: msg.ncName, message: '_cookRawGad() is not implemented' });

                tweetSpy.restore();

                done();
            });
        });

        it('should do nothing if netcore is not joinable', function (done) {
            netcore._cookRawGad = cookRawGad;

            var fbRegisterSpy = sinon.spy(fb, 'register');

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setImmediate(function () {
                expect(fbRegisterSpy).to.be.callCount(0);
                fbRegisterSpy.restore();
                done();
            });
        });

        it('should register a new gadget and emit gadIncoming msg if netcore is joinable', function (done) {
            netcore._cookRawGad = cookRawGad;

            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                registerSpy = sinon.spy(fb, 'register'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setTimeout(function () {
                var gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                    gadInMsg = {
                        ncName: 'fakeNc',
                        permAddr: '0x123456',
                        auxId: '123',
                        id: gad.get('id'),
                        gadget: gad
                    };

                expect(registerSpy).to.be.calledOnce;
                expect(registerSpy).to.be.calledWith('gadget', gad);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_INCOMING, gadInMsg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'gadIncoming', gad.get('id'));

                isJoinableStub.restore();
                registerSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 30);
        });

        it('should update gadget info and not emit event if gadget already exist', function (done) {
            netcore._cookRawGad = cookRawGad;

            var gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                gadSetSpy = sinon.spy(gad, 'set'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setImmediate(function () {
                expect(gadSetSpy).to.be.callCount(3);
                expect(fireSpy).to.be.callCount(0);
                expect(tweetSpy).to.be.callCount(0);

                gadSetSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });
    });

    describe('#ncGadReporting', function () {
        var msg = { 
            ncName: 'fakeNc', 
            permAddr: '0x123456', 
            auxId: '123', 
            data: { onOff: true, appType: 'switch' }, 
            appendFlag: false 
        };

        it('should update gadget attributes and emit event', function () {
            var dev = fb.findByNet('device', msg.ncName, msg.permAddr),
                gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                devPokeSpy = sinon.spy(dev, '_poke'),
                devSetSpy = sinon.spy(dev, 'set'),
                gadSetSpy = sinon.spy(gad, 'set'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet'),
                emitMsg = _.cloneDeep(msg);

            emitMsg.id = gad.get('id');
            delete emitMsg.appendFlag;

            fb.emit(EVT_BTM.NcGadReporting, msg);

            expect(devPokeSpy).to.be.calledOnce;
            expect(devSetSpy).to.be.calledTwice;
            expect(gadSetSpy).to.be.calledOnce;
            expect(gadSetSpy).to.be.calledWith('attrs', msg.data);
            expect(gad.get('attrs').onOff).to.be.equal(msg.data.onOff);
            expect(gad.get('attrs').appType).to.be.equal(msg.data.appType);
            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_REPORTING, emitMsg);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('gad', 'attrsReport', gad.get('id'), msg.data);

            devPokeSpy.restore();
            devSetSpy.restore();
            gadSetSpy.restore();
            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#ncBannedDevIncoming', function () {
        it('should foward event to upper layer if device not exist', function () {
            var msg = { ncName: 'fakeNc', permAddr: '0x999999', raw: {} },
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcBannedDevIncoming, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_BAN_INCOMING, { ncName: 'fakeNc', permAddr: '0x999999' });
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('dev', 'bannedDevIncoming', 0, { netcore: 'fakeNc', permAddr: '0x999999' });

            fireSpy.restore();
            tweetSpy.restore();
        });

        it('should foward event to upper layer and remove if device exist', function (done) {
            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                msg = { ncName: 'fakeNc', permAddr: 'tobermv', raw: {} },
                ncRmvStub = sinon.stub(netcore, 'remove', function (perm, cb) { cb(null); }),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            netcore._cookRawDev = function (devInst, rawDev, cb) {
                devInst.set('net', { address: { permanent: 'tobermv', dynamic: 1} });
                cb(null, devInst);
            };

            fb.emit(EVT_BTM.NcDevIncoming, msg);

            setTimeout(function () {
                var dev = fb.findByNet('device', msg.ncName, msg.permAddr);

                fb.emit(EVT_BTM.NcBannedDevIncoming, msg);

                setImmediate(function () {
                    expect(fireSpy).to.be.calledTwice;
                    expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_BAN_INCOMING, { ncName: 'fakeNc', permAddr: 'tobermv' });
                    expect(tweetSpy).to.be.calledTwice;
                    expect(tweetSpy).to.be.calledWith('dev', 'bannedDevIncoming', dev.get('id'), { netcore: 'fakeNc', permAddr: 'tobermv' });
                    expect(ncRmvStub).to.be.calledOnce;
                    expect(ncRmvStub).to.be.calledWith(msg.permAddr);

                    isJoinableStub.restore();
                    fireSpy.restore();
                    tweetSpy.restore();
                    ncRmvStub.restore();

                    dev._removing = true;
                    fb.emit(EVT_BTM.NcDevLeaving, { ncName: msg.ncName, permAddr: msg.permAddr });

                    setTimeout(function () { done(); }, 5);
                });
            }, 20);
        });
    });

    describe('#ncBannedDevReporting', function () {
        it('should foward event to upper layer if device not exist', function () {
            var msg = { ncName: 'fakeNc', permAddr: '0x999999', raw: {} },
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcBannedDevReporting, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_BAN_REPORTING, { ncName: 'fakeNc', permAddr: '0x999999' });
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('dev', 'bannedDevReporting', 0, { netcore: 'fakeNc', permAddr: '0x999999' });

            fireSpy.restore();
            tweetSpy.restore();
        });

        it('should foward event to upper layer and remove if device exist', function (done) {
            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                incomeMsg = { ncName: 'fakeNc', permAddr: 'tobermv', raw: {} },
                rptMsg = { ncName: 'fakeNc', permAddr: 'tobermv', data: {} },
                ncRmvStub = sinon.stub(netcore, 'remove', function (perm, cb) { cb(null); }),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            netcore._cookRawDev = function (devInst, rawDev, cb) {
                devInst.set('net', { address: { permanent: 'tobermv', dynamic: 1} });
                cb(null, devInst);
            };

            fb.emit(EVT_BTM.NcDevIncoming, incomeMsg);

            setTimeout(function () {
                var dev = fb.findByNet('device', rptMsg.ncName, rptMsg.permAddr);

                fb.emit(EVT_BTM.NcBannedDevReporting, rptMsg);

                setImmediate(function () {
                    expect(fireSpy).to.be.calledTwice;
                    expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_BAN_REPORTING, { ncName: 'fakeNc', permAddr: 'tobermv' });
                    expect(tweetSpy).to.be.calledTwice;
                    expect(tweetSpy).to.be.calledWith('dev', 'bannedDevReporting', dev.get('id'), { netcore: 'fakeNc', permAddr: 'tobermv' });
                    expect(ncRmvStub).to.be.calledOnce;
                    expect(ncRmvStub).to.be.calledWith(rptMsg.permAddr);

                    isJoinableStub.restore();
                    fireSpy.restore();
                    tweetSpy.restore();
                    ncRmvStub.restore();

                    dev._removing = true;
                    fb.emit(EVT_BTM.NcDevLeaving, { ncName: rptMsg.ncName, permAddr: rptMsg.permAddr });

                    setTimeout(function () { done(); }, 5);
                });
            }, 10);
        });
    });

    describe('#ncBannedGadIncoming', function () {
        var msg = { ncName: 'fakeNc', permAddr: '0x123456', auxId: '999', raw: {} },
            bannedMsg1 = { ncName: 'fakeNc', permAddr: '0x123456', auxId: '999' },
            bannedMsg2 = { netcore: 'fakeNc', permAddr: '0x123456', auxId: '999' };

        it('should foward event to upper layer if gadget not exist', function () {
            var fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcBannedGadIncoming, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_BAN_INCOMING, bannedMsg1);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('gad', 'bannedGadIncoming', 0, bannedMsg2);

            fireSpy.restore();
            tweetSpy.restore();
        });

        it('should foward event to upper layer and remove if gadget exist', function (done) {
            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                fbUnregisterSpy = sinon.spy(fb, 'unregister'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            netcore._cookRawGad = function (gadInst, rawGad, cb) {
                gadInst._auxId = '999';
                cb(null, gadInst);
            };

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setTimeout(function () {
                var gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                    gadId = gad.get('id'),
                    leavingMsg = _.cloneDeep(bannedMsg1);

                leavingMsg.id = gadId;

                fb.emit(EVT_BTM.NcBannedGadIncoming, msg);

                setTimeout(function () {
                    expect(fbUnregisterSpy).to.be.calledOnce;
                    expect(fbUnregisterSpy).to.be.calledWith('gadget', gad);
                    expect(fireSpy).to.be.calledThrice;
                    expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_BAN_INCOMING, bannedMsg1);
                    expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_LEAVING, leavingMsg);
                    expect(tweetSpy).to.be.calledThrice;
                    expect(tweetSpy).to.be.calledWith('gad', 'bannedGadIncoming', gadId, bannedMsg2);
                    expect(tweetSpy).to.be.calledWith('gad', 'gadLeaving', gadId, bannedMsg2);

                    isJoinableStub.restore();
                    fireSpy.restore();
                    tweetSpy.restore();
                    fbUnregisterSpy.restore();

                    done();
                }, 10);
            }, 10);
        });
    });

    describe('#ncBannedGadReporting', function () {
        var msg = { ncName: 'fakeNc', permAddr: '0x123456', auxId: '999', attrs: {} },
            bannedMsg1 = { ncName: 'fakeNc', permAddr: '0x123456', auxId: '999' },
            bannedMsg2 = { netcore: 'fakeNc', permAddr: '0x123456', auxId: '999' };

        it('should foward event to upper layer if gadget not exist', function () {
            var fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.NcBannedGadReporting, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_BAN_REPORTING, bannedMsg1);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('gad', 'bannedGadReporting', 0, bannedMsg2);

            fireSpy.restore();
            tweetSpy.restore();
        });

        it('should foward event to upper layer and remove if gadget exist', function (done) {
            var isJoinableStub = sinon.stub(netcore, 'isJoinable').returns(true),
                fbUnregisterSpy = sinon.spy(fb, 'unregister'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet');

            netcore._cookRawGad = function (gadInst, rawGad, cb) {
                gadInst._auxId = '999';
                cb(null, gadInst);
            };

            fb.emit(EVT_BTM.NcGadIncoming, msg);

            setTimeout(function () {
                var gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                    gadId = gad.get('id'),
                    leavingMsg = _.cloneDeep(bannedMsg1);

                leavingMsg.id = gadId;

                fb.emit(EVT_BTM.NcBannedGadReporting, msg);

                setTimeout(function () {
                    expect(fbUnregisterSpy).to.be.calledOnce;
                    expect(fbUnregisterSpy).to.be.calledWith('gadget', gad);
                    expect(fireSpy).to.be.calledThrice;
                    expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_BAN_REPORTING, bannedMsg1);
                    expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_LEAVING, leavingMsg);
                    expect(tweetSpy).to.be.calledThrice;
                    expect(tweetSpy).to.be.calledWith('gad', 'bannedGadReporting', gadId, bannedMsg2);
                    expect(tweetSpy).to.be.calledWith('gad', 'gadLeaving', gadId, bannedMsg2);

                    isJoinableStub.restore();
                    fireSpy.restore();
                    tweetSpy.restore();
                    fbUnregisterSpy.restore();

                    done();
                }, 10);
            }, 10);
        });
    });

    describe('#devError', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                    ncName: 'fakeNc',
                    error: new Error('An error occured.'),
                    id: 6
                },
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevError, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith('warn', msg.error);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('dev', 'error', msg.id, { netcore: msg.ncName, message: msg.error.message });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#devNetChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456');
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        maySleep: true,
                        address: {
                            dynamic: 50
                        }
                    }
                },
                error = new Error('error');
                modifyStub = sinon.stub(fb._devbox, 'modify', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevNetChanged, msg);

            setImmediate(function () {
                expect(modifyStub).to.be.calledOnce;
                expect(modifyStub).to.be.calledWith(msg.id, 'net', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                modifyStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit netChanged event if modify success', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        maySleep: true,
                        address: {
                            dynamic: 50
                        }
                    }
                },
                modifySpy = sinon.spy(fb._devbox, 'modify'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevNetChanged, msg);

            setTimeout(function () {
                expect(modifySpy).to.be.calledOnce;
                expect(modifySpy).to.be.calledWith(msg.id, 'net', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_NET_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'netChanged', msg.id, msg.data);

                modifySpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 20);
        });

        it('should emit statusChanged event if status changed', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456');
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        status: 'offline'
                    }
                },
                modifyStub = sinon.stub(fb._devbox, 'modify', function (i, n, d, cb) {
                    cb(null);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevNetChanged, msg);

            setImmediate(function () {
                expect(modifyStub).to.be.calledOnce;
                expect(modifyStub).to.be.calledWith(msg.id, 'net', msg.data);
                expect(fireSpy).to.be.calledTwice;
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_NET_CHANGED, msg);
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_STATUS_CHANGED, msg);
                expect(tweetSpy).to.be.calledTwice;
                expect(tweetSpy).to.be.calledWith('dev', 'netChanged', msg.id, msg.data);
                expect(tweetSpy).to.be.calledWith('dev', 'statusChanged', msg.id, msg.data);

                modifyStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });
    });

    describe('#devPropsChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456');
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        name: 'test',
                        location: 'home'
                    }
                },
                error = new Error('error');
                replaceStub = sinon.stub(fb._devbox, 'replace', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevPropsChanged, msg);

            setImmediate(function () {
                expect(replaceStub).to.be.calledOnce;
                expect(replaceStub).to.be.calledWith(msg.id, 'props', dev.get('props'));
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                replaceStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit propsChanged event if modify success', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        name: 'test',
                        location: 'home'
                    }
                },
                replaceSpy = sinon.spy(fb._devbox, 'replace'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            dev.set('props', msg.data)

            fb.emit(EVT_BTM.DevPropsChanged, msg);

            setTimeout(function () {
                expect(replaceSpy).to.be.calledOnce;
                expect(replaceSpy).to.be.calledWith(msg.id, 'props', dev.get('props'));
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_PROPS_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'propsChanged', msg.id, msg.data);

                replaceSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#devAttrsChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456');
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        manufacturer: 'sivann',
                        modle: 'xx'
                    }
                },
                error = new Error('error');
                modifyStub = sinon.stub(fb._devbox, 'modify', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevAttrsChanged, msg);

            setImmediate(function () {
                expect(modifyStub).to.be.calledOnce;
                expect(modifyStub).to.be.calledWith(msg.id, 'attrs', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                modifyStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit attrsChanged event if modify success', function (done) {
            var dev = fb.findByNet('device', 'fakeNc', '0x123456'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    id: dev.get('id'),
                    data: {
                        manufacturer: 'sivann',
                        model: 'xx'
                    }
                },
                modifySpy = sinon.spy(fb._devbox, 'modify'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.DevAttrsChanged, msg);

            setTimeout(function () {
                expect(modifySpy).to.be.calledOnce;
                expect(modifySpy).to.be.calledWith(msg.id, 'attrs', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_ATTRS_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('dev', 'attrsChanged', msg.id, msg.data);

                modifySpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#gadError', function () {
        it('should call _fire and _tweet to foward event', function () {
            var msg = {
                    ncName: 'fakeNc',
                    error: new Error('An error occured.'),
                    id: 6
                };

            var fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadError, msg);

            expect(fireSpy).to.be.calledOnce;
            expect(fireSpy).to.be.calledWith('warn', msg.error);
            expect(tweetSpy).to.be.calledOnce;
            expect(tweetSpy).to.be.calledWith('gad', 'error', msg.id, { netcore: msg.ncName, message: msg.error.message });

            fireSpy.restore();
            tweetSpy.restore();
        });
    });

    describe('#gadPanelChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var gad = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: gad.get('id'),
                    data: {
                        classId: 'xxx',
                    }
                },
                error = new Error('error');
                modifyStub = sinon.stub(fb._gadbox, 'modify', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadPanelChanged, msg);

            setImmediate(function () {
                expect(modifyStub).to.be.calledOnce;
                expect(modifyStub).to.be.calledWith(msg.id, 'panel', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                modifyStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit panelChanged event if modify success', function (done) {
            var dev = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: dev.get('id'),
                    data: {
                        classId: 'xxx',
                    }
                },
                modifySpy = sinon.spy(fb._gadbox, 'modify'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadPanelChanged, msg);

            setTimeout(function () {
                expect(modifySpy).to.be.calledOnce;
                expect(modifySpy).to.be.calledWith(msg.id, 'panel', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_PANEL_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'panelChanged', msg.id, msg.data);

                modifySpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#gadPropsChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var gad = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: gad.get('id'),
                    data: {
                        name: 'test',
                        description: 'for test'
                    }
                },
                error = new Error('error');
                replaceStub = sinon.stub(fb._gadbox, 'replace', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadPropsChanged, msg);

            setImmediate(function () {
                expect(replaceStub).to.be.calledOnce;
                expect(replaceStub).to.be.calledWith(msg.id, 'props', gad.get('props'));
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                replaceStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit propsChanged event if modify success', function (done) {
            var gad = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: gad.get('id'),
                    data: {
                        name: 'test',
                        description: 'for test'
                    }
                },
                replaceSpy = sinon.spy(fb._gadbox, 'replace'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            gad.set('props', msg.data)

            fb.emit(EVT_BTM.GadPropsChanged, msg);

            setTimeout(function () {
                expect(replaceSpy).to.be.calledOnce;
                expect(replaceSpy).to.be.calledWith(msg.id, 'props', gad.get('props'));
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_PROPS_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'propsChanged', msg.id, msg.data);

                replaceSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#gadAttrsChanged', function () {
        it('should emit error event if an error occurred when modify', function (done) {
            var gad = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: gad.get('id'),
                    data: {
                        onOff: false
                    }
                },
                error = new Error('error');
                modifyStub = sinon.stub(fb._gadbox, 'modify', function (i, n, d, cb) {
                    cb(error);
                }),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadAttrsChanged, msg);

            setImmediate(function () {
                expect(modifyStub).to.be.calledOnce;
                expect(modifyStub).to.be.calledWith(msg.id, 'attrs', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith('warn', error);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'error', msg.id, { netcore: msg.ncName, message: error.message });

                modifyStub.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            });
        });

        it('should emit attrsChanged event if modify success', function (done) {
            var dev = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: dev.get('id'),
                    data: {}
                },
                modifySpy = sinon.spy(fb._gadbox, 'modify'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadAttrsChanged, msg);

            setTimeout(function () {
                expect(modifySpy).to.be.calledOnce;
                expect(modifySpy).to.be.calledWith(msg.id, 'attrs', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_ATTRS_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'attrsChanged', msg.id, msg.data);

                modifySpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#gadAttrsAppend', function () {
        it('should emit attrsChanged event if modify success', function (done) {
            var dev = fb.findByNet('gadget', 'fakeNc', '0x123456', '123'),
                msg = {
                    ncName: 'fakeNc',
                    permAddr: '0x123456',
                    auxId: '123',
                    id: dev.get('id'),
                    data: {
                        onOff: false
                    }
                },
                replaceSpy = sinon.spy(fb._gadbox, 'replace'),
                fireSpy = sinon.spy(fb, '_fire');
                tweetSpy = sinon.spy(fb, '_tweet');

            fb.emit(EVT_BTM.GadAttrsAppend, msg);

            setTimeout(function () {
                expect(replaceSpy).to.be.calledOnce;
                expect(replaceSpy).to.be.calledWith(msg.id, 'attrs', msg.data);
                expect(fireSpy).to.be.calledOnce;
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_ATTRS_CHANGED, msg);
                expect(tweetSpy).to.be.calledOnce;
                expect(tweetSpy).to.be.calledWith('gad', 'attrsChanged', msg.id, msg.data);

                replaceSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });

    describe('#ncDevLeaving', function () {
        var msg = {
                ncName: 'fakeNc',
                permAddr: '0x123456'
            };

        it('should change device status to offline', function () {
            var dev = fb.findByNet('device', msg.ncName, msg.permAddr);

            fb.emit(EVT_BTM.NcDevLeaving, msg);

            expect(dev.get('net').status).to.be.equal('offline');
        });

        it('should remove device and gadgets from freebird if _removing flag of device is true', function (done) {
            var fbUnregisterSpy = sinon.spy(fb, 'unregister'),
                fireSpy = sinon.spy(fb, '_fire'),
                tweetSpy = sinon.spy(fb, '_tweet'),
                dev = fb.findByNet('device', msg.ncName, msg.permAddr),
                devId = dev.get('id'),
                gad = fb.findByNet('gadget', msg.ncName, msg.permAddr, '123'),
                gadId = gad.get('id');

            dev._removing = true;

            fb.emit(EVT_BTM.NcDevLeaving, msg);

            setTimeout(function () {
                expect(fbUnregisterSpy).to.be.calledTwice;
                expect(fbUnregisterSpy).to.be.calledWith('device', dev);
                expect(fbUnregisterSpy).to.be.calledWith('gadget', gad);
                expect(fireSpy).to.be.calledTwice;
                expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_LEAVING, { ncName: msg.ncName, permAddr: msg.permAddr, id: devId });
                expect(fireSpy).to.be.calledWith(EVT_TOP.GAD_LEAVING, { ncName: msg.ncName, permAddr: msg.permAddr, auxId: '123', id: gadId });
                expect(tweetSpy).to.be.calledTwice;
                expect(tweetSpy).to.be.calledWith('dev', 'devLeaving', devId, { netcore: msg.ncName, permAddr: msg.permAddr });
                expect(tweetSpy).to.be.calledWith('gad', 'gadLeaving', gadId, { netcore: msg.ncName, permAddr: msg.permAddr, auxId: '123' });

                fbUnregisterSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 10);
        });
    });
});