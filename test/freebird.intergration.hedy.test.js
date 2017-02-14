var util = require('util'),
    _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    http = require('http'),
    ncMock = require('freebird-netcore-mockup'),
    FBCONST = require('freebird-constants');

chai.use(sinonChai);

var Freebird = require('../index'),
    FB_STATE = require('../lib/utils/constants.js').FB_STATE;

var BTM_EVTS = FBCONST.EVENTS_FROM_BOTTOM,
    TOP_EVTS = FBCONST.EVENTS_TO_TOP;

var httpServer = http.createServer();

httpServer.listen(3000);

var ncMock1 = ncMock('mock01'),
    ncMock2 = ncMock('mock02', true),
    fbird = new Freebird([ ncMock1, ncMock2 ]);

describe('', function () {
    before(function (done) {
        fbird.start(function (err) {
            // console.log(err);
            if (!err) done();
        });
    });

    describe('permitJoin(duration, callback)', function () {
        it('permitJoin', function (done) {
            var pjTime = 60,
                checkCount = 0,
                lsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === pjTime) ||
                    (msg.ncName === ncMock2.getName() && msg.timeLeft === pjTime)) 
                    checkCount += 1;

                if (checkCount === 5) {
                    fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                    fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                    fbird.permitJoin(0);

                    done();
                }
            };

            fbird.permitJoin(pjTime, function (err) {
                if (!err) checkCount += 1;
            });

            fbird.on(BTM_EVTS.NcPermitJoin, lsn);
            fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
        });

        it('permitJoin again', function (done) {
            var pjTime = 120,
                checkCount = 0,
                lsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === pjTime) ||
                    (msg.ncName === ncMock2.getName() && msg.timeLeft === pjTime)) 
                    checkCount += 1;

                if (checkCount === 5) {
                    fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                    fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                    fbird.permitJoin(0);

                    done();
                }
            };

            fbird.permitJoin(pjTime, function (err) {
                if (!err) checkCount += 1;
            });

            fbird.on(BTM_EVTS.NcPermitJoin, lsn);
            fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
        });

        it('disable netcore when netcore is permitJoining', function (done) {
            var checkCount = 0,
                lsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === 0))
                    checkCount += 1;

                if (checkCount === 5) {
                    fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                    fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                    ncMock1.enable();
                    done();
                }
            };

            fbird.permitJoin(30, function (err) {
                if (!err) checkCount += 1;
            });

            setTimeout(function () {
                fbird.on(BTM_EVTS.NcPermitJoin, lsn);
                fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                
                ncMock1.disable();
            }, 300);
        });

        it('permitJoin when netcore is disable', function (done) {
            var checkCount = 0,
                errLsn,
                ncErrLsn;

            errLsn = function (err) {
                if (err && err.message === 'Netcore not enabled') 
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener('error', errLsn);
                    fbird.removeListener(BTM_EVTS.NcError, ncErrLsn);
                    ncMock1.enable();
                    
                    done();
                }
            };

            ncErrLsn = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.error.message === 'Netcore not enabled')
                    checkCount += 1;

            };

            ncMock1.disable();
            fbird.on('error', errLsn);
            fbird.on(BTM_EVTS.NcError, ncErrLsn);
            fbird.permitJoin(30);
        });
    });

    describe('ban(ncName, permAddr, callback)', function () {
        it('ban device which is not in freebird', function (done) {
            var banDevAddr = '0x12345678',
                checkCount = 0,
                lsn;

            lsn = function (msg) {
                if (msg.ncName === ncMock1.getName() && 
                    msg.permAddr === banDevAddr)
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcNetBan, lsn);
                    done();
                }
            };

            fbird.on(BTM_EVTS.NcNetBan, lsn);
            fbird.ban(ncMock1.getName(), banDevAddr, function (err, permAddr) {
                if (!err && permAddr === banDevAddr) 
                    checkCount += 1;
            });
        });

        it('ban device which is in freebird', function (done) {
            this.timeout(3500);

            var banDev,
                banDevAddr,
                checkCount = 0,
                banLsn, 
                devLeaveLsn, 
                devIncomeLsn1,
                devIncomeLsn2;

            banLsn = function (msg) {
                if (msg.ncName === ncMock1.getName() && 
                    msg.permAddr === banDevAddr)
                    checkCount += 1;
            };

            devLeaveLsn = function (msg) {
                if (msg.ncName === ncMock1.getName() && 
                    msg.permAddr === banDevAddr)
                    checkCount += 1;

                if (!fbird.findByNet('device', msg.ncName, msg.permAddr))
                    checkCount += 1;

                if (checkCount === 5) {
                    fbird.removeListener(BTM_EVTS.NcNetBan, banLsn);
                    fbird.removeListener(BTM_EVTS.NcDevLeaving, banLsn);
                    fbird.removeListener(TOP_EVTS.DEV_LEAVING, devLeaveLsn);
                    fbird.removeListener(BTM_EVTS.NcDevIncoming, devIncomeLsn1);
                    fbird.removeListener(TOP_EVTS.DEV_INCOMING, devIncomeLsn2);

                    done();
                }
            };

            devIncomeLsn1 = function (msg) {
                var dev = fbird.findByNet('device', msg.ncName, msg.permAddr);

                if (dev) {
                    banDevAddr = dev.get('permAddr');
                    fbird.permitJoin(0);
                    fbird.ban(ncMock1.getName(), banDevAddr, function (err, permAddr) {
                        if (!err && permAddr === banDevAddr) 
                            checkCount += 1;
                    });
                } else {
                    fbird.on(TOP_EVTS.DEV_INCOMING, devIncomeLsn2);
                }
            };

            devIncomeLsn2 = function (msg) {
                banDevAddr = fbird.findByNet('device', msg.ncName, msg.permAddr).get('permAddr');
                fbird.permitJoin(0);
                fbird.ban(ncMock1.getName(), banDevAddr, function (err, permAddr) {
                    if (!err && permAddr === banDevAddr) 
                        checkCount += 1;
                });
            };

            fbird.on(BTM_EVTS.NcNetBan, banLsn);
            fbird.on(BTM_EVTS.NcDevLeaving, banLsn);
            fbird.on(TOP_EVTS.DEV_LEAVING, devLeaveLsn);
            fbird.on(BTM_EVTS.NcDevIncoming, devIncomeLsn1);

            fbird.permitJoin(5);
        });

        it('ban device when netcore is disable', function (done) {
            var checkCount = 0,
                lsn;

            lsn = function (msg) {
                if (msg.error && msg.error.message === 'Netcore not enabled') 
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcError, lsn);
                    ncMock1.enable();
                    
                    done();
                }
            };

            ncMock1.disable();
            fbird.on(BTM_EVTS.NcError, lsn);
            fbird.ban(ncMock1.getName(), '0x987654321', function (err) {
                if (err && err.message === 'Netcore not enabled') 
                    checkCount += 1;
            });
        });

        it('check NcBannedDevIncoming and NcBannedGadIncoming when banned device join the network', function (done) {
            this.timeout(3500);
            var checkCount = 0,
                banDevAddr = 'AA:BB:CC:DD:EE:01',
                banGadAuxId = 'magnetometer/0',
                banDevLsn1, 
                banDevLsn2,
                banGadLsn1, 
                banGadLsn2;

            banDevLsn1 = function (msg) {
                fbird.permitJoin(0);
                if (msg.permAddr === banDevAddr && 
                    !fbird.findByNet('device', ncMock1.getName(), banDevAddr))
                    checkCount += 1;
            };

            banDevLsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === banDevAddr)
                    checkCount += 1;
            };

            banGadLsn1 = function (msg) {
                if (msg.permAddr === banDevAddr && 
                    msg.auxId === banGadAuxId && 
                    !fbird.findByNet('gadget', ncMock1.getName(), banDevAddr, banGadAuxId))
                    checkCount += 1;
            };

            banGadLsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === banDevAddr &&
                    msg.auxId === banGadAuxId)
                    checkCount += 1;

                if (checkCount === 4) {
                    fbird.removeListener(BTM_EVTS.NcBannedDevIncoming, banDevLsn1);
                    fbird.removeListener(BTM_EVTS.NcBannedGadIncoming, banGadLsn1);
                    fbird.removeListener(TOP_EVTS.DEV_BAN_INCOMING, banDevLsn2);
                    fbird.removeListener(TOP_EVTS.GAD_BAN_INCOMING, banGadLsn2);

                    done();
                }
            };

            fbird.permitJoin(5);

            fbird.on(BTM_EVTS.NcBannedDevIncoming, banDevLsn1);
            fbird.on(BTM_EVTS.NcBannedGadIncoming, banGadLsn1);
            fbird.on(TOP_EVTS.DEV_BAN_INCOMING, banDevLsn2);
            fbird.on(TOP_EVTS.GAD_BAN_INCOMING, banGadLsn2);
        });

        it('check NcBannedDevReporting when banned device reporting', function (done) {
            this.timeout(3500);
            var banDevAddr = 'AA:BB:CC:DD:EE:01',
                checkCount = 0,
                lsn1, lsn2;



            lsn1 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName()) 
                    checkCount += 1;
            };

            lsn2 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName()) 
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcBannedDevReporting, lsn1);
                    done();
                }
            };

            fbird.on(BTM_EVTS.NcBannedDevReporting, lsn1);
            fbird.on(TOP_EVTS.DEV_BAN_REPORTING, lsn2);
        });

        it('check NcBannedGadReporting when gadget of banned device reporting', function (done) {
            this.timeout(10000);
            var banDevAddr = 'AA:BB:CC:DD:EE:01',
                banGadAuxId = 'magnetometer/0',
                auxIds = ['magnetometer/0', 'lightCtrl/0', 'illuminance/0'],
                checkCount = 0,
                lsn1, lsn2;

            lsn1 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;
            };

            lsn2 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcBannedGadReporting, lsn1);
                    fbird.removeListener(TOP_EVTS.GAD_BAN_REPORTING, lsn2);
                    done();
                }
            };

            fbird.on(BTM_EVTS.NcBannedGadReporting, lsn1);
            fbird.on(TOP_EVTS.GAD_BAN_REPORTING, lsn2);
            ncMock1._controller._gadAttrRandomChanges('gad');
        });
    });

    describe('unban(ncName, permAddr, callback)', function () {
        it('unban device which is not in freebird', function (done) {
            var unbanDevAddr = '0x11111111',
                checkCount = 0,
                lsn;

            lsn = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcNetUnban, lsn);
                    done();
                }
            };

            fbird.on(BTM_EVTS.NcNetUnban, lsn);
            fbird.unban(ncMock1.getName(), unbanDevAddr, function (err, permAddr) {
                if (!err && permAddr === unbanDevAddr)
                    checkCount += 1;
            });
        });

        it('unban device which is in freebird', function (done) {
            var unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                checkCount = 0,
                lsn;

            lsn = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcNetUnban, lsn);
                    done();
                }
            };

            fbird.on(BTM_EVTS.NcNetUnban, lsn);
            fbird.unban(ncMock1.getName(), unbanDevAddr, function (err, permAddr) {
                if (!err && permAddr === unbanDevAddr)
                    checkCount += 1;
            });
        });

        it('unban device when netcore is disable', function (done) {
            var checkCount = 0,
                lsn;

            lsn = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.error.message === 'Netcore not enabled')
                    checkCount += 1;

                if (checkCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcError, lsn);
                    ncMock1.enable();
                    
                    done();
                }
            };

            ncMock1.disable();
            fbird.on(BTM_EVTS.NcError, lsn);
            fbird.unban(ncMock1.getName(), '0x22222222', function (err) {
                if (err && err.message === 'Netcore not enabled')
                    checkCount += 1;
            });
        });

        it('check NcDevIncoming and NcGadIncoming when unbanned device join the network', function (done) {
            this.timeout(3500);
            var checkCount = 0,
                unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                unbanGadAuxId = 'magnetometer/0',
                unbanDevLsn1, 
                unbanDevLsn2,
                unbanGadLsn1, 
                unbanGadLsn2;

            unbanDevLsn1 = function (msg) {                
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;
            };

            unbanDevLsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName &&
                    msg.permAddr === unbanDevAddr &&
                    fbird.findByNet('device', ncMock1.getName(), unbanDevAddr))
                    checkCount += 1;
            };

            unbanGadLsn1 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr &&
                    msg.auxId === unbanGadAuxId)
                    checkCount += 1;
            };

            unbanGadLsn2 = function (msg) {
                fbird.permitJoin(0);
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr &&
                    msg.auxId === unbanGadAuxId &&
                    fbird.findByNet('gadget', ncMock1.getName(), unbanDevAddr, unbanGadAuxId))
                    checkCount += 1;

                if (checkCount === 4) {
                    fbird.removeListener(BTM_EVTS.NcDevIncoming, unbanDevLsn1);
                    fbird.removeListener(BTM_EVTS.NcGadIncoming, unbanGadLsn1);
                    fbird.removeListener(TOP_EVTS.DEV_INCOMING, unbanDevLsn2);
                    fbird.removeListener(TOP_EVTS.GAD_INCOMING, unbanGadLsn2);

                    done();
                }
            };

            fbird.permitJoin(5);

            fbird.on(BTM_EVTS.NcDevIncoming, unbanDevLsn1);
            fbird.on(BTM_EVTS.NcGadIncoming, unbanGadLsn1);
            fbird.on(TOP_EVTS.DEV_INCOMING, unbanDevLsn2);
            fbird.on(TOP_EVTS.GAD_INCOMING, unbanGadLsn2);
        });

        it('check NcDevReporting when unbanned device reporting', function (done) {
            this.timeout(3500);
            var unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                unbanDev = fbird.findByNet('device', ncMock1.getName(), unbanDevAddr),
                checkCount = 0,
                lsn1, lsn2;

            lsn1 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;
            };

            lsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;

                if (_.isEqual(unbanDev.get('attrs').version, msg.data.version))
                    checkCount += 1;

                if (checkCount === 3) {
                    fbird.removeListener(BTM_EVTS.NcDevReporting, lsn1);
                    fbird.removeListener(TOP_EVTS.DEV_REPORTING, lsn2);

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcDevReporting, lsn1);
            fbird.on(TOP_EVTS.DEV_REPORTING, lsn2);
        });

        it('check NcGadReporting when gadget of unbanned device reporting', function (done) {
            this.timeout(3500);
            var checkCount = 0,
                unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                auxIds = ['magnetometer/0', 'lightCtrl/0', 'illuminance/0'],
                unbanGad,
                lsn1, lsn2;

            lsn1 = function (msg) {
                if (msg.permAddr === unbanDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;
            };

            lsn2 = function (msg) {
                var attName = _.keys(msg.data)[0];

                if (msg.permAddr === unbanDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;

                unbanGad = fbird.findByNet('gadget', ncMock1.getName(), unbanDevAddr, msg.auxId);

                if (unbanGad.get('attrs')[attName] === msg.data[attName])
                    checkCount += 1;

                if (checkCount === 3) {
                    fbird.removeListener(BTM_EVTS.NcGadReporting, lsn1);
                    fbird.removeListener(TOP_EVTS.GAD_REPORTING, lsn2);

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcGadReporting, lsn1);
            fbird.on(TOP_EVTS.GAD_REPORTING, lsn2);
            ncMock1._controller._gadAttrRandomChanges('gad');
        });
    });

    describe('reset(mode, callback', function () {
        it('soft reset when freebird status is unknow', function (done) {
            fbird.stop(function (err) {
                if (err) return;

                fbird.reset(0, function (err) {
                    expect(err.message).to.be.equal('You can only hard reset when freebird is stopped');
                    expect(fbird._getState()).to.be.equal(FB_STATE.UNKNOW);
                    done();
                });
            });
        });

        it('hard reset when freebird status is unknow and one netcore occurs error', function (done) {
            var resetStub = sinon.stub(ncMock1._drivers.net, 'reset', function (mode, callback) {    
                    callback(new Error('error'));
                }),
                resetSpy = sinon.spy(ncMock2, 'reset'),
                stopSpy = sinon.spy(ncMock2, 'stop'),
                loadedGads,
                loadedDevs,
                errFlag = false,
                lsn;

      /*      lsn = function (msg) {
                console.log(msg);
                if (msg.error.message === 'error')
                    errFlag = true;
            };

            fbird.on(BTM_EVTS.NcError, lsn);*/

            fbird.reset(1, function (err) {
                loadedGads = fbird._gadbox.filter(function (gad) {
                    return gad.get('netcore') === ncMock2;
                });

                loadedDevs = fbird._devbox.filter(function (dev) {
                    return dev.get('netcore') === ncMock2;
                });

                expect(err.message).to.be.equal(ncMock1.getName() + ' netcore reset failed with error: error');
                expect(loadedGads).to.be.deep.equal([]);
                expect(loadedDevs).to.be.deep.equal([]);
                expect(resetSpy).to.be.calledOnce;
                expect(stopSpy).to.be.calledTwice;
                // expect(errFlag).to.be.equal(true);
                expect(fbird._getState()).to.be.equal(FB_STATE.UNKNOW);

                resetStub.restore();
                resetSpy.restore();
                stopSpy.restore();
                // fbird.removeListener(BTM_EVTS.NcError, lsn);

                done();
            });
        });

        it('hard reset when freebird status is unknow', function (done) {
            var loadedGads1,
                loadedDevs1,
                loadedGads2,
                loadedDevs2,
                readyFlag = false,
                lsn;

            lsn = function () {
                readyFlag = true;
            };

            ncMock1.enable();
            ncMock2.enable();

            fbird.on(TOP_EVTS.READY, lsn);

            fbird.reset(1, function (err) {
                loadedGads1 = fbird._gadbox.filter(function (gad) {
                    return gad.get('netcore') === ncMock1;
                });

                loadedGads2 = fbird._gadbox.filter(function (gad) {
                    return gad.get('netcore') === ncMock2;
                });

                loadedDevs1 = fbird._devbox.filter(function (dev) {
                    return dev.get('netcore') === ncMock1;
                });

                loadedDevs2 = fbird._devbox.filter(function (dev) {
                    return dev.get('netcore') === ncMock2;
                });

                expect(loadedGads1).to.be.deep.equal([]);
                expect(loadedDevs1).to.be.deep.equal([]);
                expect(loadedGads2).to.be.deep.equal([]);
                expect(loadedDevs2).to.be.deep.equal([]);
                expect(readyFlag).to.be.equal(true);
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);

                fbird.removeListener(TOP_EVTS.READY, lsn);

                done();
            });
        });
fbird.on(BTM_EVTS.NcError, function (msg) {
    console.log(msg);
});
        it('soft reset when freebird status is normal and one netcore occurs error', function (done) {
            var resetStub = sinon.stub(ncMock1._drivers.net, 'reset', function (mode, callback) {    
                    callback(new Error('error'));
                }),
                errFlag = false,
                lsn;

            lsn = function (msg) {
                if (msg.error.message === 'error')
                    btmErrFlag = true;
            };

            fbird.on(BTM_EVTS.NcError, lsn);

            fbird.reset(0, function (err) {
                expect(err.message).to.be.equal(ncMock1.getName() + ' netcore reset failed with error: error');
                expect(errFlag).to.be.equal(true);
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);

                resetStub.restore();
                // fbird.removeListener(BTM_EVTS.NcError, lsn);

                done();
            });
        });

        it('soft reset when freebird status is normal', function () {

        });

        it('hard reset when freebird status is normal and one netcore occurs error', function () {

        });

        it('hard reset when freebird status is normal', function () {

        });

        it('call start() when freebird is restting', function () {

        });

        it('call stop() when freebird is restting', function () {

        });

        it('call reset() when freebird is restting', function () {

        });
    });
});