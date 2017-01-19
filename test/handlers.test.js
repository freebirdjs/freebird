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
            }, 20);
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

                registerSpy.restore();
                fireSpy.restore();
                tweetSpy.restore();

                done();
            }, 20);
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
        it('should foward event to upper layer', function () {
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
    });

    describe('#ncBannedDevReporting', function () {

    });

    describe('#ncBannedGadIncoming', function () {

    });

    describe('#ncBannedGadReporting', function () {

    });

    describe('#devError', function () {

    });

    describe('#devNetChanged', function () {

    });

    describe('#devPropsChanged', function () {

    });

    describe('#devAttrsChanged', function () {

    });

    describe('#gadError', function () {

    });

    describe('#gadPanelChanged', function () {

    });

    describe('#gadPropsChanged', function () {

    });

    describe('#gadAttrsChanged', function () {

    });

    describe('#gadAttrsAppend', function () {

    });

    // describe('#ncDevLeaving', function () {
    //     var msg = {
    //             ncName: 'fakeNc',
    //             permAddr: '0x123456'
    //         };

    //     it('should change device status to offline', function () {
    //         var dev = fb.findByNet('device', msg.ncName, msg.permAddr);

    //         fb.emit(EVT_BTM.NcDevLeaving, msg);

    //         expect(dev.get('net').status).to.be.equal('offline');
    //     });

    //     it('should remove device from freebird if _removing flag of device is true', function (done) {
    //         var fbUnregisterSpy = sinon.spy(fb, 'unregister'),
    //             fireSpy = sinon.spy(fb, '_fire'),
    //             tweetSpy = sinon.spy(fb, '_tweet'),
    //             dev = fb.findByNet('device', msg.ncName, msg.permAddr),
    //             devId = dev.get('id');

    //         dev._removing = true;

    //         fb.emit(EVT_BTM.NcDevLeaving, msg);

    //         setTimeout(function () {
    //             expect(fbUnregisterSpy).to.be.calledOnce;
    //             expect(fbUnregisterSpy).to.be.calledWith('device', dev);
    //             expect(fireSpy).to.be.calledOnce;
    //             expect(fireSpy).to.be.calledWith(EVT_TOP.DEV_LEAVING, { ncName: msg.ncName, permAddr: msg.permAddr, id: devId });
    //             expect(tweetSpy).to.be.callCount;
    //             expect(tweetSpy).to.be.calledWith('dev', 'devLeaving', devId, { netcore: msg.ncName, permAddr: msg.permAddr });

    //             fbUnregisterSpy.restore();
    //             fireSpy.restore();
    //             tweetSpy.restore();

    //             done();
    //         }, 10);
    //     });
    // });
});