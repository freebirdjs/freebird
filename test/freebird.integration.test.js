var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    ncMock = require('freebird-netcore-mockup'),
    FBCONST = require('freebird-constants'),
    fbRpc = require('freebird-rpc');

chai.use(sinonChai);

// try {
//     fs.unlinkSync(path.resolve('../database/devices.db'));
//     fs.unlinkSync(path.resolve('../database/gadgets.db'));
// } catch (e) {
//     console.log(e);
// }

var Freebird = require('../index');
    
var FB_STATE = require('../lib/utils/constants.js').FB_STATE,
    NC_STATE = require('../lib/utils/constants.js').NC_STATE,
    BTM_EVTS = FBCONST.EVENTS_FROM_BOTTOM,
    TOP_EVTS = FBCONST.EVENTS_TO_TOP;

var ncMock1 = ncMock('mock01'),
    ncMock2 = ncMock('mock02', true),
    fbird,
    httpServer = http.createServer();

httpServer.listen(3030);

var rpcServer = fbRpc.createServer(httpServer),
    rpcClient = fbRpc.createClient('ws://localhost:3030');


describe('Intergration test', function () {
    describe('#new Freebird()', function () {
        before(function () {
            fbird = new Freebird([ ncMock1, ncMock2 ]);
        });

        it('should has all correct members after new', function () {
            expect(fbird._netcores).to.be.an('array');
            expect(fbird._netcores[0].name).to.be.equal('mock01');
            expect(fbird._netcores[1].name).to.be.equal('mock02');
            expect(fbird._devbox).to.be.an('object');
            expect(fbird._gadbox).to.be.an('object');
            expect(fbird._apiAgent).to.be.an('object');
            expect(fbird._state).to.be.equal(FB_STATE.UNKNOW);
            expect(fbird._eventQueue).to.be.an('array');
        });
    });

    describe('#.addTransport()', function () {
        it('should add transport', function (done) {
            fbird.addTransport('', rpcServer, function (err) {
                if (!err)
                    done();
            });
        });
    });

    describe('#.start()', function () {
        it("freebird at 'unknow' state, should has one netcore start error", function (done) {
            var nc2_startStub = sinon.stub(ncMock2, 'start', function (callback) {
                process.nextTick(function () {
                    callback(new Error('start error'));
                });
            });

            if (fbird._getState() === FB_STATE.UNKNOW)
                fbird.start(function (err) {
                    if (err) {
                        expect(ncMock1._state).to.be.equal(NC_STATE.UNKNOW);
                        expect(ncMock2._state).to.be.equal(NC_STATE.UNKNOW);
                        nc2_startStub.restore();
                        done();
                    }
                });
        });

        it("freebird at 'unknow' state, should has all netcores start", function (done) {
            this.timeout(10000);
            if (fbird._getState() === FB_STATE.UNKNOW) {
                var nc1startCalled, nc2startCalled,
                    nc1enabledCalled, nc2enabledCalled,
                    fbReadyCalled, startCalled,
                    rpcNc1enabled, rpcNc2enabled, rpcNc1started, rpcNc2started,
                    checkDone = function () {
                        if (nc1startCalled && nc2startCalled && nc1enabledCalled && nc2enabledCalled && fbReadyCalled &&
                            startCalled && rpcNc1enabled && rpcNc2enabled && rpcNc1started && rpcNc2started) {
                            fbird.removeListener(TOP_EVTS.NC_STARTED, ncStartLsn);
                            fbird.removeListener(TOP_EVTS.NC_ENABLED, ncEnabledLsn);
                            rpcClient.removeListener('ind', topLsn);
                            done();
                        }
                    },
                    ncStartLsn = function (nc) {
                        if (nc.ncName === ncMock1.getName())
                            nc1startCalled = true;
                        else if (nc.ncName === ncMock2.getName())
                            nc2startCalled = true;

                        checkDone();
                    },
                    ncEnabledLsn = function (nc) {
                        if (nc.ncName === ncMock1.getName())
                            nc1enabledCalled = true;
                        else if (nc.ncName === ncMock2.getName())
                            nc2enabledCalled = true;
                        
                        checkDone();
                    },
                    topLsn = function (msg) {
                        if (msg.subsys === 'net' && msg.type === 'enabled') {
                            if (msg.data.netcore === ncMock1.getName())
                                rpcNc1enabled = true;
                            else if (msg.data.netcore === ncMock2.getName())
                                rpcNc2enabled = true;
                        } else if (msg.subsys === 'net' && msg.type === 'started') {
                            if (msg.data.netcore === ncMock1.getName())
                                rpcNc1started = true;
                            else if (msg.data.netcore === ncMock2.getName())
                                rpcNc2started = true;
                        }
                        checkDone();
                    };

                rpcClient.on('ind', topLsn);
                fbird.on(TOP_EVTS.NC_STARTED, ncStartLsn);
                fbird.on(TOP_EVTS.NC_ENABLED, ncEnabledLsn);
                fbird.once(TOP_EVTS.READY, function () {
                    fbReadyCalled = true;
                    checkDone();
                });

                fbird.start(function (err) {
                    if (!err) {
                        expect(ncMock1._state).to.be.equal(NC_STATE.NORMAL);
                        expect(ncMock2._state).to.be.equal(NC_STATE.NORMAL);
                        startCalled = true;
                        checkDone();
                    }
                });
            }
        });

        it("freebird at 'normal' state, and also all netcores state 'normal'", function (done) {
            if (fbird._getState() === FB_STATE.NORMAL)
                fbird.start(function (err) {
                    if (err.message === 'All netcores have been started') {
                        expect(ncMock1._state).to.be.equal(NC_STATE.NORMAL);
                        expect(ncMock2._state).to.be.equal(NC_STATE.NORMAL);
                        done();
                    }
                });
        });

        it("freebird at 'normal' state, but one netcore state is 'unknow'", function (done) {
            if (fbird._getState() === FB_STATE.NORMAL)
                ncMock2.stop(function (err) {
                    if (!err && ncMock2._state === NC_STATE.UNKNOW)
                        fbird.start(function (err) {
                            if (!err) {
                                expect(ncMock1._state).to.be.equal(NC_STATE.NORMAL);
                                expect(ncMock2._state).to.be.equal(NC_STATE.NORMAL);
                                done();
                            }
                        });
                });
        });

        it('call the .start() function at starting', function (done) {
            if (fbird._getState() === FB_STATE.NORMAL)
                fbird.stop(function (err) {
                    var firstStartCalled = false,
                        secondStartCalled = false;

                    if (!err) {
                        fbird.start(function (err) {
                            if (!err) {
                                firstStartCalled = true;
                                if (secondStartCalled) done();
                            }
                        });

                        fbird.start(function (err) {
                            if (err.message === 'Freebird can not start now') {
                                secondStartCalled = true;
                                if (firstStartCalled) done();
                            }
                        });
                    }
                });
        });

        it('call the .stop() function at starting', function (done) {
            if (fbird._getState() === FB_STATE.NORMAL)
                fbird.stop(function (err) {
                    var startCalled = false,
                        stopCalled = false;

                    if (!err) {
                        fbird.start(function (err) {
                            if (!err) {
                                startCalled = true;
                                if (stopCalled) done();
                            }
                        });

                        fbird.stop(function (err) {
                            if (err.message === 'Freebird can not stop now') {
                                stopCalled = true;
                                if (startCalled) done();
                            }
                        });
                    }
                });
        });

        it('call the .reset() function at starting', function (done) {
            if (fbird._getState() === FB_STATE.NORMAL)
                fbird.stop(function (err) {
                    var startCalled = false,
                        resetCalled = false;

                    if (!err) {
                        fbird.start(function (err) {
                            if (!err) {
                                startCalled = true;
                                if (resetCalled) done();
                            }
                        });

                        fbird.reset(0, function (err) {
                            if (err.message === 'Freebird can not reset now') {
                                resetCalled = true;
                                if (startCalled) done();
                            }
                        });
                    }
                });
        });
    });

    describe('#.permitJoin()', function () {
        it('permitJoin', function (done) {
            var pjTime = 60,
                checkCount = 0,
                lsn,
                topLsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === pjTime) ||
                    (msg.ncName === ncMock2.getName() && msg.timeLeft === pjTime)) 
                    checkCount += 1;
            };

            topLsn = function (msg) {
                if (msg.subsys === 'net' &&
                    msg.type === 'permitJoining' &&
                    ((msg.data.netcore === ncMock1.getName() && msg.data.timeLeft === pjTime) ||
                    (msg.data.netcore === ncMock2.getName() && msg.data.timeLeft === pjTime))) {
                    checkCount += 1;

                    if (checkCount === 7) {
                        fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                        fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                        rpcClient.removeListener('ind', topLsn);
                        fbird.permitJoin(0);

                        done();
                    }
                }
            };

            fbird.on(BTM_EVTS.NcPermitJoin, lsn);
            fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
            rpcClient.on('ind', topLsn);

            fbird.permitJoin(pjTime, function (err) {
                if (!err) checkCount += 1;
            });
        });

        it('permitJoin again', function (done) {
            var pjTime = 120,
                checkCount = 0,
                lsn,
                topLsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === pjTime) ||
                    (msg.ncName === ncMock2.getName() && msg.timeLeft === pjTime)) 
                    checkCount += 1;
            };

            topLsn = function (msg) {
                if (msg.subsys === 'net' &&
                    msg.type === 'permitJoining' &&
                    ((msg.data.netcore === ncMock1.getName() && msg.data.timeLeft === pjTime) ||
                    (msg.data.netcore === ncMock2.getName() && msg.data.timeLeft === pjTime))) {
                    checkCount += 1;

                    if (checkCount === 7) {
                        fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                        fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                        rpcClient.removeListener('ind', topLsn);
                        fbird.permitJoin(0);

                        done();
                    }
                }
            };

            fbird.on(BTM_EVTS.NcPermitJoin, lsn);
            fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
            rpcClient.on('ind', topLsn);

            fbird.permitJoin(pjTime, function (err) {
                if (!err) checkCount += 1;
            });
        });

        it('disable netcore when netcore is permitJoining', function (done) {
            var checkCount = 0,
                lsn,
                topLsn;

            lsn = function (msg) {
                if ((msg.ncName === ncMock1.getName() && msg.timeLeft === 0))
                    checkCount += 1;
            };

            topLsn = function (msg) {
                if (msg.subsys === 'net' &&
                    msg.type === 'permitJoining' &&
                    ((msg.data.netcore === ncMock1.getName() && msg.data.timeLeft === 0) ||
                    (msg.data.netcore === ncMock2.getName() && msg.data.timeLeft === 0))) {
                    checkCount += 1;

                    if (checkCount === 7) {
                        fbird.removeListener(BTM_EVTS.NcPermitJoin, lsn);
                        fbird.removeListener(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                        rpcClient.removeListener('ind', topLsn);
                        ncMock1.enable();

                        done();
                    }
                }
            };

            fbird.permitJoin(30, function (err) {
                if (!err) checkCount += 1;
            });

            setTimeout(function () {
                fbird.on(BTM_EVTS.NcPermitJoin, lsn);
                fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
                rpcClient.on('ind', topLsn);
                
                ncMock1.disable();
            }, 300);
        });

        it('permitJoin when netcore is disable', function (done) {
            var checkCount = 0,
                errLsn,
                ncErrLsn,
                topLsn;

            errLsn = function (err) {
                if (err && err.message === 'Netcore not enabled') 
                    checkCount += 1;

                if (checkCount === 3) {
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

            topLsn = function (msg) {
                if (msg.subsys === 'net' &&
                    msg.type === 'error' &&
                    msg.data.netcore === ncMock1.getName() && 
                    msg.data.message === 'Netcore not enabled') {
                    checkCount += 1;
                }
            };

            ncMock1.disable();
            fbird.on('error', errLsn);
            fbird.on(BTM_EVTS.NcError, ncErrLsn);
            rpcClient.on('ind', topLsn);
            fbird.permitJoin(30);
        });
    });

    describe('#.ban()', function () {
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
                devIncomeLsn2,
                topLsn;

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
            };

            topLsn = function (msg) {
                if (msg.subsys === 'dev' &&
                    msg.type === 'devLeaving' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.permAddr === banDevAddr) 
                    checkCount += 1;

                if (checkCount === 6) {
                    fbird.removeListener(BTM_EVTS.NcNetBan, banLsn);
                    fbird.removeListener(BTM_EVTS.NcDevLeaving, banLsn);
                    fbird.removeListener(TOP_EVTS.DEV_LEAVING, devLeaveLsn);
                    fbird.removeListener(BTM_EVTS.NcDevIncoming, devIncomeLsn1);
                    fbird.removeListener(TOP_EVTS.DEV_INCOMING, devIncomeLsn2);
                    rpcClient.removeListener('ind', topLsn);

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcNetBan, banLsn);
            fbird.on(BTM_EVTS.NcDevLeaving, banLsn);
            fbird.on(TOP_EVTS.DEV_LEAVING, devLeaveLsn);
            fbird.on(BTM_EVTS.NcDevIncoming, devIncomeLsn1);
            rpcClient.on('ind', topLsn);

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
                banGadLsn2,
                topLsn;

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
            };

            topLsn = function (msg) {
                if (msg.subsys === 'dev' &&
                    msg.type === 'bannedDevIncoming' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.permAddr === banDevAddr) 
                    checkCount += 1;

                if (msg.subsys === 'gad' &&
                    msg.type === 'bannedGadIncoming' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.permAddr === banDevAddr &&
                    msg.data.auxId === banGadAuxId) 
                    checkCount += 1;

                if (checkCount === 6) {
                    fbird.removeListener(BTM_EVTS.NcBannedDevIncoming, banDevLsn1);
                    fbird.removeListener(BTM_EVTS.NcBannedGadIncoming, banGadLsn1);
                    fbird.removeListener(TOP_EVTS.DEV_BAN_INCOMING, banDevLsn2);
                    fbird.removeListener(TOP_EVTS.GAD_BAN_INCOMING, banGadLsn2);
                    rpcClient.removeListener('ind', topLsn);

                    done();
                }
            };

            fbird.permitJoin(5);

            fbird.on(BTM_EVTS.NcBannedDevIncoming, banDevLsn1);
            fbird.on(BTM_EVTS.NcBannedGadIncoming, banGadLsn1);
            fbird.on(TOP_EVTS.DEV_BAN_INCOMING, banDevLsn2);
            fbird.on(TOP_EVTS.GAD_BAN_INCOMING, banGadLsn2);
            rpcClient.on('ind', topLsn);

            ncMock1._controller._devAttrRandomChanges('attr');
        });

        it('check NcBannedDevReporting when banned device reporting', function (done) {
            this.timeout(3500);
            var banDevAddr = 'AA:BB:CC:DD:EE:01',
                checkCount = 0,
                lsn1, lsn2, topLsn;

            lsn1 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName()) 
                    checkCount += 1;

                fbird.removeListener(BTM_EVTS.NcBannedDevReporting, lsn1);
            };

            lsn2 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName()) 
                    checkCount += 1;

                fbird.removeListener(TOP_EVTS.DEV_BAN_REPORTING, lsn2);
            };

            topLsn = function (msg) {
                if (msg.subsys === 'dev' &&
                    msg.type === 'bannedDevReporting' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.permAddr === banDevAddr) {
                    checkCount += 1;
                    fbird.removeListener('ind', topLsn);

                    if (checkCount === 3)
                        done();
                }
            };

            fbird.on(BTM_EVTS.NcBannedDevReporting, lsn1);
            fbird.on(TOP_EVTS.DEV_BAN_REPORTING, lsn2);
            rpcClient.on('ind', topLsn);
            ncMock1._controller._devAttrRandomChanges('attr');
        });

        it('check NcBannedGadReporting when gadget of banned device reporting', function (done) {
            this.timeout(10000);
            var banDevAddr = 'AA:BB:CC:DD:EE:01',
                auxIds = ['magnetometer/0', 'lightCtrl/0', 'illuminance/0'],
                checkCount = 0,
                lsn1, lsn2, topLsn;

            lsn1 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;

                fbird.removeListener(BTM_EVTS.NcBannedGadReporting, lsn1);
            };

            lsn2 = function (msg) {
                if (msg.permAddr === banDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId))
                    checkCount += 1;

                fbird.removeListener(TOP_EVTS.GAD_BAN_REPORTING, lsn2);
            };

            topLsn = function (msg) {
                if (msg.subsys === 'gad' &&
                    msg.type === 'bannedGadReporting' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.permAddr === banDevAddr &&
                    _.includes(auxIds, msg.data.auxId)) {
                    checkCount += 1;
                    fbird.removeListener('ind', topLsn);

                    if (checkCount === 3)
                        done();
                }
            };

            fbird.on(BTM_EVTS.NcBannedGadReporting, lsn1);
            fbird.on(TOP_EVTS.GAD_BAN_REPORTING, lsn2);
            rpcClient.on('ind', topLsn);
            ncMock1._controller._gadAttrRandomChanges('gad');
        });
    });

    describe('#.unban()', function () {
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
                unbanGadLsn2,
                topLsn;

            unbanDevLsn1 = function (msg) {                
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr) {
                    checkCount += 1;
                    fbird.removeListener(BTM_EVTS.NcDevIncoming, unbanDevLsn1);
                }
            };

            unbanDevLsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr &&
                    fbird.findByNet('device', ncMock1.getName(), unbanDevAddr)) {
                    checkCount += 1;
                    fbird.removeListener(TOP_EVTS.DEV_INCOMING, unbanDevLsn2);
                }
            };

            unbanGadLsn1 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr &&
                    msg.auxId === unbanGadAuxId) {
                    checkCount += 1;
                    fbird.removeListener(BTM_EVTS.NcGadIncoming, unbanGadLsn1);
                }
            };

            unbanGadLsn2 = function (msg) {
                fbird.permitJoin(0);
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr &&
                    msg.auxId === unbanGadAuxId &&
                    fbird.findByNet('gadget', ncMock1.getName(), unbanDevAddr, unbanGadAuxId)) {
                    checkCount += 1;
                    fbird.removeListener(TOP_EVTS.GAD_INCOMING, unbanGadLsn2);
                }
            };

            topLsn = function (msg) {
                if (msg.subsys === 'dev' &&
                    msg.type === 'devIncoming' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.net.address.permanent === unbanDevAddr)
                    checkCount += 1;

                if (msg.subsys === 'gad' &&
                    msg.type === 'gadIncoming' &&
                    msg.data.netcore === ncMock1.getName() &&
                    msg.data.dev.permAddr === unbanDevAddr &&
                    msg.data.auxId === unbanGadAuxId) {
                    checkCount += 1;

                    if (checkCount === 6) {
                        fbird.removeListener('ind', topLsn);
                        done();
                    }
                }
            };

            fbird.permitJoin(5);

            fbird.on(BTM_EVTS.NcDevIncoming, unbanDevLsn1);
            fbird.on(BTM_EVTS.NcGadIncoming, unbanGadLsn1);
            fbird.on(TOP_EVTS.DEV_INCOMING, unbanDevLsn2);
            fbird.on(TOP_EVTS.GAD_INCOMING, unbanGadLsn2);
            rpcClient.on('ind', topLsn);
        });

        it('check NcDevReporting when unbanned device reporting', function (done) {
            this.timeout(3500);
            var unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                unbanDev = fbird.findByNet('device', ncMock1.getName(), unbanDevAddr),
                checkCount = 0,
                lsn1, lsn2;

            lsn1 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr) {
                    checkCount += 1;
                    fbird.removeListener(BTM_EVTS.NcDevReporting, lsn1);
                }
            };

            lsn2 = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.permAddr === unbanDevAddr)
                    checkCount += 1;

                if (_.isEqual(unbanDev.get('attrs').version, msg.data.version))
                    checkCount += 1;

                if (checkCount === 3) {
                    fbird.removeListener(TOP_EVTS.DEV_REPORTING, lsn2);

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcDevReporting, lsn1);
            fbird.on(TOP_EVTS.DEV_REPORTING, lsn2);

            ncMock1._controller._devAttrRandomChanges('attr');
        });

        it('check NcGadReporting when gadget of unbanned device reporting', function (done) {
            this.timeout(3500);
            var checkCount = 0,
                unbanDevAddr = 'AA:BB:CC:DD:EE:01',
                auxIds = ['magnetometer/0', 'lightCtrl/0', 'illuminance/0'],
                unbanGad,
                lsn1, lsn2, topLsn;

            lsn1 = function (msg) {
                if (msg.permAddr === unbanDevAddr &&
                    msg.ncName === ncMock1.getName() &&
                    _.includes(auxIds, msg.auxId)) {
                    checkCount += 1;
                    fbird.removeListener(BTM_EVTS.NcGadReporting, lsn1);
                }
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
            };

            topLsn = function (msg) {
                if (msg.subsys === 'gad' &&
                    msg.type === 'attrsReport' &&
                    msg.id === unbanGad.get('id')) {
                    checkCount += 1;
                    fbird.removeListener('ind', topLsn);

                    if (checkCount === 4) {
                        fbird.removeListener(TOP_EVTS.GAD_REPORTING, lsn2);
                        fbird.remove(ncMock1.getName(), unbanDevAddr, function (err) {
                            if (!err)
                                done();
                        });
                    }
                }
            };

            fbird.on(BTM_EVTS.NcGadReporting, lsn1);
            fbird.on(TOP_EVTS.GAD_REPORTING, lsn2);
            rpcClient.on('ind', topLsn);
            ncMock1._controller._gadAttrRandomChanges('gad');
        });
    });

    describe('#event - devIncoming', function () {
        it('new device incoming, so not exist database', function (done) {
            this.timeout(30000);
            var incomingCalled, devEnableCalled, devOnlineCalled, topLsnCalled,
                rpcDevIncoming, rpcDevOnline, rpcDevEnable,
                checkDone = function () {
                    if (incomingCalled && devEnableCalled && devOnlineCalled && topLsnCalled) {
                        fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                        rpcClient.removeListener('ind', topLsn);
                        done();
                    }
                },
                netChangeLsn = function (msg) {
                    if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.data.status === 'online') {
                        devOnlineCalled = true;
                        checkDone();
                    } else if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.data.enabled === true) {
                        devEnableCalled = true;
                        checkDone();
                    }
                },
                topLsn = function (msg) {
                    if (msg.subsys === 'dev' && msg.type === 'devIncoming') {
                        if (msg.data.net.address.permanent === 'AA:BB:CC:DD:EE:01')
                            rpcDevIncoming = true;
                    } else if (msg.subsys === 'dev' && msg.type === 'netChanged') {
                        if (msg.data.status === 'online')
                            rpcDevOnline = true;
                        else if (msg.data.enabled === true)
                            rpcDevEnable = true;
                    }

                    if (rpcDevIncoming && rpcDevOnline && rpcDevEnable) {
                        topLsnCalled = true;
                        checkDone();
                    }
                };

            rpcClient.on('ind', topLsn);
            fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
            fbird.once(TOP_EVTS.DEV_INCOMING, function (dev) {
                fbird.permitJoin(0);
                if (dev.ncName === 'mock01' && dev.permAddr === 'AA:BB:CC:DD:EE:01') {
                    incomingCalled = true;
                    checkDone();
                }
            });

            fbird.permitJoin(60);
        });

        it('old device incoming, device exist database', function (done) {
            this.timeout(10000);
            var netChangeCalled, rpcDevIncoming,
                devMock1 = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                oldInfo = devMock1.get('net'),
                newInfo,
                netChangeLsn = function (msg) {
                    if (msg.data.status === 'online' && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                        fbird.permitJoin(0);

                        newInfo = devMock1.get('net');
                        delete oldInfo.joinTime;
                        delete oldInfo.timestamp;
                        delete newInfo.joinTime;
                        delete newInfo.timestamp;

                        if (_.isEqual(oldInfo, newInfo)) {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                            netChangeCalled = true;
                            if (netChangeCalled && rpcDevIncoming)
                                done();
                        }
                    }
                },
                topLsn = function (msg) {
                    if (msg.subsys === 'dev' && msg.type === 'statusChanged') {
                        var dev = fbird.findById('device', msg.id),
                            permAddr = dev.get('permAddr');
                        if (permAddr === 'AA:BB:CC:DD:EE:01' && msg.data.status === 'online') {
                            rpcClient.removeListener('ind', topLsn);
                            rpcDevIncoming = true;
                            if (netChangeCalled && rpcDevIncoming)
                                done();
                        }
                    }
                };

            devMock1.set('net', {
                role: 'router',
                parent: '7',
                maySleep: false,
                sleepPeriod: 120,
                address: { permanent: 'AA:BB:CC:DD:EE:01', dynamic: '200.200.200.1' }
            });

            rpcClient.on('ind', topLsn);
            fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

            ncMock1._controller._DeviceLeave('AA:BB:CC:DD:EE:01');
            fbird.permitJoin(60);
        });
    });

    describe('#event - gadIncoming', function () {
        it('new gadget incoming, so not exist database', function (done) {
            this.timeout(10000);
            var incomingCalled, devEnableCalled, devOnlineCalled, rpcIncomingCalled,
                pwrCtrlIncoming, temperaturelIncoming, rpcPwrCtrlIncoming, rpcTemperaturelIncoming,
                checkDone = function () {
                    if (incomingCalled && devEnableCalled && devOnlineCalled && rpcIncomingCalled) {
                        fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                        fbird.removeListener(TOP_EVTS.GAD_INCOMING, gadIncomingLsn);
                        rpcClient.removeListener('ind', topLsn);
                        done();
                    }
                },
                netChangeLsn = function (msg) {
                    if (msg.permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.status === 'online')
                        devOnlineCalled = true;
                    else if (msg.permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.enabled === true)
                        devEnableCalled = true;

                    checkDone();
                },
                gadIncomingLsn = function (gad) {
                    if (gad.ncName === 'mock01' && gad.permAddr === 'AA:BB:CC:DD:EE:02') {
                        if (gad.auxId === 'pwrCtrl/0')
                            pwrCtrlIncoming = true;
                        else if (gad.auxId === 'temperature/0')
                            temperaturelIncoming = true;

                        if (pwrCtrlIncoming && temperaturelIncoming) {
                            fbird.permitJoin(0);
                            incomingCalled = true;
                            checkDone();
                        }
                    }
                },
                topLsn = function (msg) {
                    if (msg.subsys === 'gad' && msg.type === 'gadIncoming') {
                        if (msg.data.dev.permAddr === 'AA:BB:CC:DD:EE:02') {
                            if (msg.data.auxId === 'pwrCtrl/0')
                                rpcPwrCtrlIncoming = true;
                            else if (msg.data.auxId === 'temperature/0')
                                rpcTemperaturelIncoming = true;

                            if (rpcPwrCtrlIncoming && rpcTemperaturelIncoming) {
                                rpcIncomingCalled = true;
                                checkDone();
                            }
                        }
                    }
                };

            rpcClient.on('ind', topLsn);
            fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
            fbird.on(TOP_EVTS.GAD_INCOMING, gadIncomingLsn);
            fbird.once(TOP_EVTS.DEV_INCOMING, function (dev) {
                
                if (dev.ncName === 'mock01' && dev.permAddr === 'AA:BB:CC:DD:EE:02') {
                    incomingCalled = true;
                    checkDone();
                }
            });
            fbird.permitJoin(60);
        });

        it('old gadget incoming, gadget exist database', function (done) {
            this.timeout(10000);
            var oldGadMock1 = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:02', 'pwrCtrl/0'),
                oldAttrs = oldGadMock1.get('attrs'),
                incomingCalled, devOnlineCalled, gadAttrsChangeCalled,
                pwrCtrlIncoming, temperaturelIncoming,
                checkDone = function () {
                    if (incomingCalled && devOnlineCalled && gadAttrsChangeCalled) {
                        fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                        fbird.removeListener(BTM_EVTS.NcGadIncoming, gadIncomingLsn);
                        fbird.removeListener(TOP_EVTS.GAD_ATTRS_CHANGED, gadAttrsChangeLsn);
                        done();
                    }
                },
                netChangeLsn = function (msg) {
                    if (msg.permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.status === 'online') {
                        devOnlineCalled = true;
                        checkDone();
                    }
                },
                gadIncomingLsn = function (gad) {
                    if (gad.ncName === 'mock01' && gad.permAddr === 'AA:BB:CC:DD:EE:02') {
                        if (gad.auxId === 'pwrCtrl/0')
                            pwrCtrlIncoming = true;
                        else if (gad.auxId === 'temperature/0')
                            temperaturelIncoming = true;

                        if (pwrCtrlIncoming && temperaturelIncoming) {
                            fbird.permitJoin(0);
                            incomingCalled = true;
                            checkDone();
                        }
                    }
                },
                gadAttrsChangeLsn = function (msg) {
                    if (msg.ncName === 'mock01' && msg.permAddr === 'AA:BB:CC:DD:EE:02' && _.isEqual(oldAttrs, msg.data)) {
                        gadAttrsChangeCalled = true;
                        checkDone();
                    }
                };

            oldGadMock1.set('attrs', {
                onOff: true,
                dimmer: 128,
                onTime: 77,
            });

            fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
            fbird.on(BTM_EVTS.NcGadIncoming, gadIncomingLsn);
            fbird.on(TOP_EVTS.GAD_ATTRS_CHANGED, gadAttrsChangeLsn);
            ncMock1._controller._DeviceLeave('AA:BB:CC:DD:EE:02');
            fbird.permitJoin(60);
        });
    });

    describe('#event - devNetChanging', function () {
        it('device net information change', function (done) {
            this.timeout(10000);
            var netChangeLsn = function (msg) {
                    var dev = fbird.findByNet('device', msg.ncName, msg.permAddr),
                        netInfo = dev.get('net');

                    if (_.isEqual(netInfo.address.dynamic, msg.data.address.dynamic))
                        done();
                };

            fbird.once(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
        });
    });

    describe('#event - devReporting', function () {
        it('device attribute reporting', function (done) {
            this.timeout(10000);
            var devReportingLsn = function (msg) {
                    var dev = fbird.findByNet('device', msg.ncName, msg.permAddr),
                        netAttrs = dev.get('attrs');

                    if (msg.data.version && _.isEqual(netAttrs.version.hw, msg.data.version.hw)) {
                        fbird.removeListener(TOP_EVTS.DEV_REPORTING, devReportingLsn);
                        done();
                    }
                };

            fbird.on(TOP_EVTS.DEV_REPORTING, devReportingLsn);
        });
    });

    // describe('#event - gadReporting', function () {
    //     it('gadget attribute reporting', function (done) {
    //         this.timeout(15000);
    //         var gadReporting, rpcGadReporting,
    //             gadReportingLsn = function (msg) {
    //                 var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
    //                     gadAttrs = gad.get('attrs'),
    //                     attrKey = _.keys(msg.data)[0];

    //                 if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
    //                     gadReporting = true;
    //                     if (gadReporting && rpcGadReporting)
    //                         done();
    //                 }
    //             },
    //             topLsn = function (msg) {
    //                 if (msg.subsys === 'gad' && msg.type === 'attrsReport') {
    //                     rpcClient.removeListener('ind', topLsn);
    //                     var gad = fbird.findById('gadget', msg.id),
    //                         gadAttrs = gad.get('attrs'),
    //                         attrKey = _.keys(msg.data)[0];

    //                     if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
    //                         rpcGadReporting = true;
    //                         if (gadReporting && rpcGadReporting)
    //                             done();
    //                     }
    //                 }
    //             };

    //         rpcClient.on('ind', topLsn);
    //         fbird.once(TOP_EVTS.GAD_REPORTING, gadReportingLsn);
    //     });

    //     it('gadget attribute reporting - appendFlag', function (done) {
    //         this.timeout(15000);
    //         var gadAttrsAppendCalled, rpcGadReporting,
    //             topLsn = function (msg) {
    //                 if (msg.subsys === 'gad' && msg.type === 'attrsChanged') {
    //                     rpcClient.removeListener('ind', topLsn);
    //                     var gad = fbird.findById('gadget', msg.id),
    //                         gadAttrs = gad.get('attrs'),
    //                         attrKey = _.keys(msg.data)[0];

    //                     if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
    //                         rpcGadReporting = true;
    //                         if (gadAttrsAppendCalled && rpcGadReporting)
    //                             done();
    //                     }
    //                 }
    //             };

    //         rpcClient.on('ind', topLsn);
    //         fbird.once(BTM_EVTS.GadAttrsAppend, function (msg) {
    //             var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
    //                 gadAttrs = gad.get('attrs'),
    //                 attrKey = _.keys(msg.data)[0];

    //             if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
    //                 gadAttrsAppendCalled = true;
    //                 if (gadAttrsAppendCalled && rpcGadReporting)
    //                     done();
    //             }
    //         });

    //         ncMock1._controller._gadAttrRandomChanges('gad', true);
    //     });
    // });

    // describe('#event - devLeaving', function () {
    //     it('device offline', function (done) {
    //         this.timeout(10000);
    //         var netChangeLsn = function (msg) {
    //                 if (msg.data.status === 'offline' && msg.permAddr === 'AA:BB:CC:DD:EE:02'){
    //                     fbird.permitJoin(0);
    //                     fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
    //                     done();
    //                 }
    //             };

    //         fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

    //         ncMock1._controller._DeviceLeave('AA:BB:CC:DD:EE:02');
    //         fbird.permitJoin(60);
    //     });

    //     it('manually remove device', function (done) {
    //         this.timeout(10000);
    //         var removeCbCalled, devLeavingCalled, netChangeCalled, rpcDevLeaving, rpcAllLeaving,
    //             rpcIlluminanceLeaving, rpcLightCtrlLeaving, rpcMagnetometerLeaving,
    //             checkDone = function () {
    //                 if (removeCbCalled && devLeavingCalled && netChangeCalled && rpcAllLeaving)
    //                     done();
    //             },
    //             devLeavingLsn = function (msg) {
    //                 if (msg.ncName === 'mock01' && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
    //                     fbird.removeListener(TOP_EVTS.DEV_LEAVING, devLeavingLsn);
    //                     devLeavingCalled = true;
    //                     checkDone();
    //                 }
    //             },
    //             netChangeLsn = function (msg) {
    //                 if (msg.data.status === 'online' && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
    //                     fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
    //                     netChangeCalled = true;
    //                     checkDone();
    //                 }
    //             },
    //             topLsn = function (msg) {
    //                 if (msg.subsys === 'dev' && msg.type === 'devLeaving') {
    //                     if (msg.data.netcore === ncMock1.getName() && msg.data.permAddr === 'AA:BB:CC:DD:EE:01')
    //                         rpcDevLeaving = true;
    //                 } else if (msg.subsys === 'gad' && msg.type === 'gadLeaving' && msg.data.permAddr === 'AA:BB:CC:DD:EE:01') {
    //                     if (msg.data.auxId === 'illuminance/0')
    //                         rpcIlluminanceLeaving = true;
    //                     else if (msg.data.auxId === 'lightCtrl/0')
    //                         rpcLightCtrlLeaving = true;
    //                     else if (msg.data.auxId === 'magnetometer/0')
    //                         rpcMagnetometerLeaving = true;
    //                 }

    //                 if (rpcDevLeaving && rpcIlluminanceLeaving && rpcLightCtrlLeaving && rpcMagnetometerLeaving) {
    //                     rpcClient.removeListener('ind', topLsn);
    //                     rpcAllLeaving = true;
    //                     checkDone();
    //                 }
    //             };

    //         rpcClient.on('ind', topLsn);
    //         fbird.on(TOP_EVTS.DEV_LEAVING, devLeavingLsn);
    //         fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

    //         fbird.remove('mock01', 'AA:BB:CC:DD:EE:01', function (err, permAddr) {
    //             if (!err && permAddr === 'AA:BB:CC:DD:EE:01') {
    //                 removeCbCalled = true;
    //                 checkDone();
    //             }
    //         });
    //         fbird.permitJoin(60);
    //     });
    // });

    describe('#.ping()', function () {
        it('should has callback msg when device is in fb', function (done) {
            var id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

            fbird.permitJoin(30);
            fbird.ping('mock01', permAddr, function (err, msg) {
                expect(msg).to.be.eql('ping_' + permAddr);
                done();
            });
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

            nc.disable();

            fbird.ping('mock01', permAddr, function (err, msg) {
                if (err) {
                    nc.enable();
                    fbird.permitJoin(60);
                    done();
                }
            });
        });
    });

    describe('#.maintain()', function () {
        it('should call all controllers gadRead', function (done) {
            var nc1 = fbird.findByNet('netcore', 'mock01'),
                nc2 = fbird.findByNet('netcore', 'mock02'),
                nc1GadReadStub = sinon.stub(nc1._drivers.gad, 'read', function (permAddr, auxId, attr, done) {    
                    if (done) done(null, 'gadRead_' + permAddr + '_' + auxId + '_' + attr);
                }),
                nc2MaintainStub = sinon.stub(nc2, 'maintain', function (done) {    
                    if (done) done(null);
                });

            fbird.maintain(function (err, msg) {
                expect(nc1GadReadStub).to.be.called;
                expect(nc2MaintainStub).to.be.called;
                nc1GadReadStub.restore();
                nc2MaintainStub.restore();
                done();
            });
        });

        it('should has Dev and Gad AttrsChanged event', function (done) {
            var nc1 = fbird.findByNet('netcore', 'mock01'),
                nc2 = fbird.findByNet('netcore', 'mock02'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird.filter('device', function (device) {
                    return device.get('status') === 'online';
                })[0],
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                devAttrData = {},
                gadAttrData = {},
                count = 0;

            devAttrData.model = 'xxx';
            gadAttrData[attrName] = 'xxx';
            dev.set('attrs', devAttrData);
            gad.set('attrs', gadAttrData);

            function countChk() {
                if (count === 4) {
                    done();
                }
            }

            function devEventTestFunction(msg) {
                if (msg._data.model === 'xxx') {
                    fbird.removeListener(FBCONST.EVENTS_TO_TOP.DEV_ATTRS_CHANGED, devEventTestFunction);
                    expect(msg.data.model).to.be.eql('devRead_' + msg.permAddr + '_model');
                    count += 1;
                    countChk();
                }
            }

            function gadEventTestFunction(msg) {
                if (msg._data[attrName] === 'xxx') {
                    fbird.removeListener(FBCONST.EVENTS_TO_TOP.GAD_ATTRS_CHANGED, gadEventTestFunction);
                    expect(msg.data[attrName]).to.be.eql('gadRead_' + msg.permAddr + '_' + auxId + '_' + attrName);
                    count += 1;
                    countChk();
                }
            }

            fbird.on(FBCONST.EVENTS_TO_TOP.DEV_ATTRS_CHANGED, devEventTestFunction);
            fbird.on(FBCONST.EVENTS_TO_TOP.GAD_ATTRS_CHANGED, gadEventTestFunction);

            function rpcDevTestFunction(msg) {
                if (msg.subsys === 'dev' && msg.type === 'attrsChanged' && msg.data.model === 'devRead_' + permAddr + '_model') {
                    rpcClient.removeListener('ind', rpcDevTestFunction);
                    count += 1;
                    countChk();
                }
            }

            function rpcGadTestFunction(msg) {
                if (msg.subsys === 'gad' && msg.type === 'attrsChanged' && msg.data[attrName] === 'gadRead_' + permAddr + '_' + auxId + '_' + attrName) {
                    rpcClient.removeListener('ind', rpcGadTestFunction);
                    count += 1;
                    countChk();
                }
            }

            rpcClient.on('ind', rpcDevTestFunction);
            rpcClient.on('ind', rpcGadTestFunction);

            fbird.maintain(function (err, msg) {
                if (err)
                    console.log(err);
            });
        });

        it('should call one controller gadRead', function (done) {
            var nc1 = fbird.findByNet('netcore', 'mock01'),
                nc2 = fbird.findByNet('netcore', 'mock02'),
                nc1GadReadStub = sinon.stub(nc1._drivers.gad, 'read', function (permAddr, auxId, attr, done) {    
                    if (done) done(null, 'gadRead_' + permAddr + '_' + auxId + '_' + attr);
                }),
                nc2MaintainStub = sinon.stub(nc2, 'maintain', function (done) {    
                    if (done) done(null);
                });

            fbird.maintain('mock01', function (err, msg) {
                expect(nc1GadReadStub).to.be.called;
                expect(nc2MaintainStub).to.be.not.called;
                nc1GadReadStub.restore();
                nc2MaintainStub.restore();
                done();
            });
        });

        it('should no msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01');

            nc.disable();

            fbird.maintain(function (err, msg) {
                 if (!err && !msg) {
                    nc.enable();
                    fbird.permitJoin(60);
                    done();
                }
            });
        });
    });

    describe('#.remove()', function () {
        it('should has callback msg and NcDevLeaving event when device is in fb', function (done) {
            var dev = fbird.filter('device', function (device) {
                    return device.get('status') === 'online';
                })[0],
                nc = dev.get('netcore'),
                id = dev.get('id'),
                permAddr = dev.get('permAddr'),
                count = 0;

            function countChk() {
                if (count === 2) {
                    done();
                }
            }

            fbird.once(FBCONST.EVENTS_TO_TOP.DEV_LEAVING, function () {
                nc._controller._reloadheldDevice();
                nc._controller._newDevice();
                fbird.once(FBCONST.EVENTS_TO_TOP.GAD_INCOMING, function () {
                    count += 1;
                    countChk();
                });    
            });

            function rpcTestFunction(msg) {
                if (msg.type === 'devLeaving') {
                    rpcClient.removeListener('ind', rpcTestFunction);
                    expect(msg.subsys).to.be.eql('dev');
                    expect(msg.id).to.be.eql(id);
                    expect(msg.data.netcore).to.be.eql('mock01');
                    expect(msg.data.permAddr).to.be.eql('AA:BB:CC:DD:EE:01');
                    count += 1;
                    countChk();  
                }
            }

            rpcClient.on('ind', rpcTestFunction);

            fbird.remove('mock01', permAddr, function (err, msg) {
                expect(msg).to.be.eql(permAddr);
            });
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

            nc.disable();

            fbird.remove('mock01', permAddr, function (err, msg) {
                if (err) {
                    nc.enable();
                    fbird.permitJoin(60);
                    done();
                }
            });
        });
    });

    describe('#Device', function () {
        describe('#.read()', function () {
            it('read device attribute', function (done) {
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');
                dev.read('model', function (err, data) {
                    if (!err && data === 'devRead_AA:BB:CC:DD:EE:02_model')
                        done();
                });
            });

            it('read device attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:02') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            dev.read('model', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('read device attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        dev.read('model', function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });

        describe('#.write()', function () {
            it('write device attribute', function (done) {
                this.timeout(10000);
                var rpcAttrsChanged, writeCbCalled,
                    dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02'),
                    topLsn = function (msg) {
                        if (msg.subsys === 'dev' && msg.type === 'attrsChanged') {
                            var dev = fbird.findById('device', msg.id),
                                permAddr = dev.get('permAddr');

                            if (permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.model === 'devWrite_AA:BB:CC:DD:EE:02') {
                                rpcClient.removeListener('ind', topLsn);
                                rpcAttrsChanged = true;

                                if (writeCbCalled && rpcAttrsChanged)
                                    done();
                            }
                        }
                    };


                rpcClient.on('ind', topLsn);
                dev.write('model', 'lwmqn-7688-happy-duo', function (err, data) {
                    if (!err && data === 'devWrite_AA:BB:CC:DD:EE:02') {
                        writeCbCalled = true;

                        if (writeCbCalled && rpcAttrsChanged)
                            done();
                    }
                });
            });

            it('write device attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:02') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            dev.write('model', 'lwmqn-7688-happy-duo', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('write device attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        dev.write('model', 'lwmqn-7688-happy-duo', function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });

        describe('#.identify()', function () {  // controller.js L403
            it('identify device', function (done) {
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');
                dev.identify(function (err, data) {
                    if (!err && data === 'devIdentify_AA:BB:CC:DD:EE:02')
                        done();
                });
            });

            it('identify device, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:02') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            dev.identify(function (err) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('identify device, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        dev.identify(function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });
    });

    describe('#Gadget', function () {
        describe('#.read', function () {
            it('read gadget attribute', function (done) {
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                gad.read('sensorValue', function (err, data) {
                    if (!err && data === 'gadRead_AA:BB:CC:DD:EE:01_illuminance/0_sensorValue')
                        done();
                });
            });

            it('read gadget attribute, but gadget disabled', function (done) {
                this.timeout(3000);
                var readCbCalled, rpcPanelChanged,
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    gadChangeLsn = function (msg) {
                        if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.auxId === 'illuminance/0' && msg.data.enabled === false) {
                            fbird.removeListener(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                            gad.read('sensorValue', function (err, data) {
                                if (err.message === 'Gadget disabled.') {
                                    gad.enable();
                                    readCbCalled = true;
                                    if (readCbCalled && rpcPanelChanged)
                                        done();
                                }
                            });
                        }
                    },
                    topLsn = function (msg) {
                        if (msg.subsys === 'gad' && msg.type === 'panelChanged') {
                            var gad = fbird.findById('gadget', msg.id),
                                permAddr = gad.get('permAddr'),
                                auxId = gad.get('auxId');

                            if (permAddr === 'AA:BB:CC:DD:EE:01' && auxId === 'illuminance/0' && msg.data.enabled === false) {
                                rpcClient.removeListener('ind', topLsn);
                                rpcPanelChanged = true;

                                if (readCbCalled && rpcPanelChanged)
                                    done();
                            }
                        }
                    };

                rpcClient.on('ind', topLsn);
                fbird.on(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('read gadget attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            gad.read('sensorValue', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('read gadget attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        gad.read('sensorValue', function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });

        describe('#.write', function () {
            it('write gadget attribute', function (done) {
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                gad.write('sensorValue', 18, function (err, data) {
                    if (!err && data === 'gadWrite_AA:BB:CC:DD:EE:01_illuminance/0_sensorValue')
                        done();
                });
            });

            it('write gadget attribute, but gadget disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    gadChangeLsn = function (msg) {
                        if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.auxId === 'illuminance/0' && msg.data.enabled === false) {
                            fbird.removeListener(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                            gad.write('sensorValue', 18, function (err, data) {
                                if (err.message === 'Gadget disabled.') {
                                    gad.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('write gadget attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            gad.write('sensorValue', 18, function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('write gadget attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        gad.write('sensorValue', 18, function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });

        describe('#.exec', function () {
            it('execute gadget', function (done) {
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                gad.exec('blink', [ 10 ], function (err, data) {
                    if (!err && data === 'gadExec_AA:BB:CC:DD:EE:01_illuminance/0_blink')
                        done();
                });
            });

            it('execute gadget, but gadget disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    gadChangeLsn = function (msg) {
                        if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.auxId === 'illuminance/0' && msg.data.enabled === false) {
                            fbird.removeListener(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                            gad.exec('blink', [ 10 ], function (err, data) {
                                if (err.message === 'Gadget disabled.') {
                                    gad.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('execute gadget, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);

                            gad.exec('blink', [ 10 ], function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(TOP_EVTS.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('execute gadget, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(TOP_EVTS.NC_DISABLED, function (msg) {
                    if (msg.ncName === 'mock01')
                        gad.exec('blink', [ 10 ], function (err, data) {
                            if (err.message === 'Netcore disabled.') {
                                ncMock1.enable();
                                done();
                            }
                        });
                });

                ncMock1.disable();
            });
        });
    });

    describe('#.readReportCfg()', function () {
        it('should has callback msg', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0];

            gad.readReportCfg(attrName, function (err, msg) {
                expect(msg).to.be.eql('readReportCfg_' + permAddr + '_' + auxId + '_' + attrName);
                done();
            });
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0];

            nc.disable();

            gad.readReportCfg(attrName, function (err, msg) {
                if (err) {
                    nc.enable();
                    fbird.permitJoin(60);
                    done();
                }
            });
        });

        it('should has err msg when dev is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0];

            dev.disable();
            
            gad.readReportCfg(attrName, function (err, msg) {
                if (err) {
                    dev.enable();
                    done();
                }
            });
        });

        it('should has err msg when gad is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0];

            gad.disable();
            
            gad.readReportCfg(attrName, function (err, msg) {
                if (err) {
                    gad.enable();
                    done();
                }
            });
        });
    });

    describe('#.writeReportCfg()', function () {
        it('should has callback msg', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                cfg = { pmin: 1, pmax: 100};

            gad.writeReportCfg(attrName, cfg, function (err, msg) {
                expect(msg).to.be.eql('writeReportCfg_' + permAddr + '_' + auxId + '_' + attrName);
                done();
            });
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                cfg = { pmin: 1, pmax: 100};

            nc.disable();

            gad.writeReportCfg(attrName, cfg, function (err, msg) {
                if (err) {
                    nc.enable();
                    fbird.permitJoin(60);
                    done();
                }
            });
        });

        it('should has err msg when dev is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                cfg = { pmin: 1, pmax: 100};

            dev.disable();
            
            gad.writeReportCfg(attrName, cfg, function (err, msg) {
                if (err) {
                    dev.enable();
                    done();
                }
            });
        });

        it('should has err msg when gad is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                cfg = { pmin: 1, pmax: 100};

            gad.disable();
            
            gad.writeReportCfg(attrName, cfg, function (err, msg) {
                if (err) {
                    gad.enable();
                    done();
                }
            });
        });
    });

    describe('#RPC request test', function () {
        it('#.disable()', function (done) {
            var nc = fbird.filter('netcore', function (netcore) {
                return netcore.isEnabled();
            })[0];

            rpcClient.send('net', 'disable', { ncName: nc.getName() }, function (err, result) {
                expect(nc.isEnabled()).to.be.equal(false);
                done();
            });
        });

        it('#.enable()', function (done) {
            rpcClient.send('net', 'enable', { ncName: ncMock1.getName() }, function (err, result) {
                expect(ncMock1.isEnabled()).to.be.equal(true);
                done();
            });
        });
    });

    describe('#.reset()', function () {
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
                loadedDevs;

            ncMock1.enable();
            ncMock2.enable();

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
                expect(fbird._getState()).to.be.equal(FB_STATE.UNKNOW);

                resetStub.restore();
                resetSpy.restore();
                stopSpy.restore();

                done();
            });
        });

        it('hard reset when freebird status is unknow', function (done) {
            var loadedGads1,
                loadedDevs1,
                loadedGads2,
                loadedDevs2,
                readyFlag = false,
                checkCount = 0,
                lsn,
                topLsn;

            lsn = function () {
                readyFlag = true;
                fbird.removeListener(TOP_EVTS.READY, lsn);
            };

            topLsn = function (msg) {
                if (msg.subsys === 'net') {
                    if (msg.type === 'stopped' && msg.data.netcore === ncMock1.getName())
                        checkCount += 1;

                    if (msg.type === 'started' && msg.data.netcore === ncMock1.getName())
                        checkCount += 1;
                }

                if (checkCount === 3) {
                    rpcClient.removeListener('ind', topLsn);
                    done();
                }
            };

            ncMock1.enable();
            ncMock2.enable();

            fbird.on(TOP_EVTS.READY, lsn);
            rpcClient.on('ind', topLsn);

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
            });
        });

        it('soft reset when freebird status is normal and one netcore occurs error', function (done) {
            var resetStub = sinon.stub(ncMock1._drivers.net, 'reset', function (mode, callback) {    
                    callback(new Error('error'));
                }),
                errCount = 0,
                ncErrLsn,
                errLsn;

            ncErrLsn = function (msg) {
                if (msg.error.message === 'error')
                    errCount += 1;
            };

            errLsn = function (err) {
                if (err.message === 'error')
                    errCount += 1;

                if (errCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcError, ncErrLsn);
                    fbird.removeListener(TOP_EVTS.ERROR, errLsn);
                    resetStub.restore();

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcError, ncErrLsn);
            fbird.on(TOP_EVTS.ERROR, errLsn);

            fbird.reset(0, function (err) {
                expect(err.message).to.be.equal(ncMock1.getName() + ' netcore reset failed with error: error');
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);
            });
        });

        it('soft reset when freebird status is normal', function (done) {
            var readyFlag = false,
                lsn;

            lsn = function () {
                readyFlag = true;
            };

            fbird.on(TOP_EVTS.READY, lsn);

            fbird.reset(0, function (err) {
                expect(err).to.be.null;
                expect(readyFlag).to.be.equal(true);
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);

                fbird.removeListener(TOP_EVTS.READY, lsn);

                done();
            });
        });

        it('hard reset when freebird status is normal and one netcore occurs error', function (done) {
            var resetStub = sinon.stub(ncMock1._drivers.net, 'reset', function (mode, callback) {    
                    callback(new Error('error'));
                }),
                loadedGads,
                loadedDevs,
                errCount = 0,
                ncErrLsn,
                errLsn;

            ncErrLsn = function (msg) {
                if (msg.error.message === 'error')
                    errCount += 1;
            };

            errLsn = function (err) {
                if (err.message === 'error')
                    errCount += 1;

                if (errCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcError, ncErrLsn);
                    fbird.removeListener(TOP_EVTS.ERROR, errLsn);
                    resetStub.restore();

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcError, ncErrLsn);
            fbird.on(TOP_EVTS.ERROR, errLsn);

            fbird.reset(1, function (err) {
                loadedGads = fbird._gadbox.filter(function (gad) {
                    return gad.get('netcore') === ncMock2;
                });

                loadedDevs = fbird._gadbox.filter(function (dev) {
                    return dev.get('netcore') === ncMock2;
                });


                expect(err.message).to.be.equal(ncMock1.getName() + ' netcore reset failed with error: error');
                expect(loadedGads).to.be.deep.equal([]);
                expect(loadedDevs).to.be.deep.equal([]);
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);
            });
        });

        it('hard reset when freebird status is normal', function (done) {
            var loadedGads1,
                loadedGads2,
                loadedDevs1,
                loadedDevs2,
                readyFlag,
                lsn;

            lsn = function () {
                readyFlag = true;
            };

            fbird.on(TOP_EVTS.READY, lsn);

            fbird.reset(0, function (err) {
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
                expect(err).to.be.null;
                expect(readyFlag).to.be.equal(true);
                expect(fbird._getState()).to.be.equal(FB_STATE.NORMAL);

                fbird.removeListener(TOP_EVTS.READY, lsn);

                done();
            });
        });

        it('call start() when freebird is restting', function (done) {
            var resetStub = sinon.stub(fbird, 'reset', function (mode, callback) {
                    fbird._setState(FB_STATE.RESETTING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                startErrFlag = false;

            fbird.reset(0, function () {
                if (startErrFlag) {
                    resetStub.restore();
                    done();
                }
            });

            fbird.start(function (err) {
                if (err && err.message === 'Freebird can not start now')
                    startErrFlag = true;
            });
        });

        it('call stop() when freebird is restting', function (done) {
            var resetStub = sinon.stub(fbird, 'reset', function (mode, callback) {
                    fbird._setState(FB_STATE.RESETTING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                stopErrFlag = false;

            fbird.reset(0, function () {
                if (stopErrFlag) {
                    resetStub.restore();
                    fbird._setState(FB_STATE.NORMAL);
                    done();
                }
            });

            fbird.stop(function (err) {
                if (err && err.message === 'Freebird can not stop now')
                    stopErrFlag = true;
            });
        });

        it('call reset() when freebird is restting', function (done) {
            var fbReset = fbird.reset.bind(fbird),
                resetStub = sinon.stub(fbird, 'reset', function (mode, callback) {
                    fbird._setState(FB_STATE.RESETTING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                resetErrFlag = false;

            fbird.reset(0, function () {
                if (resetErrFlag) {
                    resetStub.restore();
                    fbird._setState(FB_STATE.NORMAL);
                    done();
                }
            });

            fbReset(0, function (err) {
                if (err && err.message === 'Freebird can not reset now')
                    resetErrFlag = true;
            });
        });
    });

    describe('#.stop()', function () {
        it('stop when freebird status is unknow', function (done) {
            fbird.stop(function (err) {
                if (err) return;

                fbird.stop(function (err) {
                    expect(err.message).to.be.equal('Freebird can not stop now');
                    expect(fbird._getState()).to.be.equal(FB_STATE.UNKNOW);
                    done();
                });
            });
        });

        it('stop when freebird status is normal and one netcore occurs error', function (done) {
            var stopStub = sinon.stub(ncMock1._drivers.net, 'stop', function (callback) {    
                    callback(new Error('error'));
                }),
                fbState,
                errCount = 0,
                ncErrLsn,
                errLsn;

            ncErrLsn = function (msg) {
                if (msg.ncName === ncMock1.getName() &&
                    msg.error.message === 'error')
                    errCount += 1;
            };

            errLsn = function (error) {
                if (error.message === 'error')
                    errCount += 1;

                if (errCount === 2) {
                    fbird.removeListener(BTM_EVTS.NcError, ncErrLsn);
                    fbird.removeListener(TOP_EVTS.ERROR, errLsn);
                    stopStub.restore();

                    done();
                }
            };

            fbird.on(BTM_EVTS.NcError, ncErrLsn);
            fbird.on(TOP_EVTS.ERROR, errLsn);

            fbird.start(function (err) {
                if (err) return;

                fbState = fbird._getState();
                fbird.stop(function (err) {
                    expect(err.message).to.be.equal(ncMock1.getName() + ' netcore stop failed with error: error');
                    expect(fbird._getState()).to.be.equal(fbState);
                });
            });
        });

        it('stop when freebird status is normal', function (done) {
            var checkCount = 0,
                btmStopLsn,
                topStopLsn,
                topLsn;

            btmStopLsn = function () {
                checkCount += 1;
            };

            topStopLsn = function (msg) {
                if (msg.ncName === ncMock1.getName() ||
                    msg.ncName === ncMock2.getName())
                    checkCount += 1;
            };

            topLsn = function (msg) {
                if (msg.subsys === 'net' &&
                    msg.type === 'stopped' &&
                    msg.data.netcore === ncMock1.getName()) {
                    checkCount += 1;
                    rpcClient.removeListener('ind', topLsn);

                    if (checkCount === 5) {
                        fbird.removeListener(BTM_EVTS.NcStopped, btmStopLsn);
                        fbird.removeListener(TOP_EVTS.NC_STOPPED, topStopLsn);
                        done();
                    }
                }
            };

            fbird.on(BTM_EVTS.NcStopped, btmStopLsn);
                fbird.on(TOP_EVTS.NC_STOPPED, topStopLsn);
                rpcClient.on('ind', topLsn);

            ncMock2.start(function () {
                fbird.stop(function (err) {
                    expect(err).to.be.null;
                    expect(fbird._getState()).to.be.equal(FB_STATE.UNKNOW);
                });
            });            
        });

        it('call start() when freebird is stopping', function (done) {
            var stopStub = sinon.stub(fbird, 'stop', function (callback) {
                    fbird._setState(FB_STATE.STOPPING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                startErrFlag = false;

            fbird.stop(function () {
                if (startErrFlag) {
                    stopStub.restore();
                    done();
                }
            });

            fbird.start(function (err) {
                if (err && err.message === 'Freebird can not start now')
                    startErrFlag = true;
            });
        });

        it('call stop() when freebird is stopping', function (done) {
            var fbStop = fbird.stop.bind(fbird),
                stopStub = sinon.stub(fbird, 'stop', function (callback) {
                    fbird._setState(FB_STATE.STOPPING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                stopErrFlag = false;

            fbird.stop(function () {
                if (stopErrFlag) {
                    stopStub.restore();
                    done();
                }
            });

            fbStop(function (err) {
                if (err && err.message === 'Freebird can not stop now')
                    stopErrFlag = true;
            });
        });

        it('call reset() when freebird is stopping', function () {
            var stopStub = sinon.stub(fbird, 'stop', function (callback) {
                    fbird._setState(FB_STATE.STOPPING);
                    setTimeout(function () {
                        callback(null);
                    }, 10);
                }),
                resetErrFlag = false;

            fbird.stop(function () {
                if (resetErrFlag) {
                    stopStub.restore();
                    done();
                }
            });

            fbird.reset(0, function (err) {
                if (err && err.message === 'Freebird can not reset now')
                    resetErrFlag = true;
            });
        });
    });
});
