var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    http = require('http');

var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = chai.expect;

var fbRpc = require('freebird-rpc'),
    FBCONST = require('freebird-constants'),
    ncMock = require('freebird-netcore-mockup');

var Freebird = require('../index'),
    FB_STATE = require('../lib/utils/constants.js').FB_STATE,
    NC_STATE = require('../lib/utils/constants.js').NC_STATE;

var EVT_TOP = FBCONST.EVENTS_TO_TOP,
    EVT_BTM = FBCONST.EVENTS_FROM_BOTTOM;

var httpServer = http.createServer();

httpServer.listen(3000);

var rpcServer = fbRpc.createServer(httpServer);

var ncMock1 = ncMock('mock01'),
    ncMock2 = ncMock('mock02', true),
    fbird;

describe('Test', function () {
    before(function (done) {
        var unlink1 = false,
            unlink2 = false;

        fs.stat('../database/devices.db', function (err, stats) {
            if (err) {
                fs.stat('./database', function (err, stats) {
                    if (err) {
                        fs.mkdir('../database', function () {
                            unlink1 = true;
                            if (unlink1 && unlink2)
                                done();
                        });
                    } else {
                        unlink1 = true;
                        if (unlink1 && unlink2)
                            done();
                    }
                });
            } else if (stats.isFile()) {
                fs.unlink(path.resolve('../database/devices.db'), function () {
                    unlink1 = true;
                    if (unlink1 && unlink2)
                        done();
                });
            }
        });

        fs.stat('../database/gadgets.db', function (err, stats) {
            if (err) {
                fs.stat('./database', function (err, stats) {
                    if (err) {
                        fs.mkdir('../database', function () {
                            unlink2 = true;
                            if (unlink1 && unlink2)
                                done();
                        });
                    } else {
                        unlink2 = true;
                        if (unlink1 && unlink2)
                            done();
                    }
                });
            } else if (stats.isFile()) {
                fs.unlink(path.resolve('../database/gadgets.db'), function () {
                    unlink2 = true;
                    if (unlink1 && unlink2)
                        done();
                });
            }
        });
    });

    describe('#new Freebird', function () {
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

    describe('#.addTransport', function () {
        it('should add transport', function (done) {
            fbird.addTransport('', rpcServer, function (err) {
                if (!err)
                    done();
            });
        });
    });

    describe('#.start', function () {
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
            if (fbird._getState() === FB_STATE.UNKNOW) {
                var nc1startCalled, nc2startCalled,
                    nc1enabledCalled, nc2enabledCalled,
                    fbReadyCalled, startCalled,
                    checkDone = function () {
                        if (nc1startCalled && nc2startCalled && nc1enabledCalled &&
                            nc2enabledCalled && fbReadyCalled && startCalled) {
                            fbird.removeListener(EVT_TOP.NC_STARTED, ncStartLsn);
                            fbird.removeListener(EVT_TOP.NC_ENABLED, ncEnabledLsn);
                            done();
                        }
                    },
                    ncStartLsn = function (nc) {
                        if (nc.ncName === ncMock1.getName()) {
                            nc1startCalled = true;
                            checkDone();
                        } else if (nc.ncName === ncMock2.getName()) {
                            nc2startCalled = true;
                            checkDone();
                        }
                    },
                    ncEnabledLsn = function (nc) {
                        if (nc.ncName === ncMock1.getName()) {
                            nc1enabledCalled = true;
                            checkDone();
                        } else if (nc.ncName === ncMock2.getName()) {
                            nc2enabledCalled = true;
                            checkDone();
                        }
                    };

                fbird.on(EVT_TOP.NC_STARTED, ncStartLsn);
                fbird.on(EVT_TOP.NC_ENABLED, ncEnabledLsn);
                fbird.once(EVT_TOP.READY, function () {
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

    describe('#event - devIncoming', function () {
        it('new device incoming, so not exist database', function (done) {
            this.timeout(15000);
            var incomingCalled, devEnableCalled, devOnlineCalled,
                checkDone = function () {
                    if (incomingCalled && devEnableCalled && devOnlineCalled) {
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
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
                };

            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
            fbird.once(EVT_TOP.DEV_INCOMING, function (dev) {
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
            var devMock1 = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
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
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
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

            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

            ncMock1._controller._DeviceLeave('AA:BB:CC:DD:EE:01');
            fbird.permitJoin(60);
        });
    });

    describe('#event - gadIncoming', function () {
        it('new gadget incoming, so not exist database', function (done) {
            this.timeout(10000);
            var incomingCalled, devEnableCalled, devOnlineCalled,
                pwrCtrlIncoming, temperaturelIncoming,
                checkDone = function () {
                    if (incomingCalled && devEnableCalled && devOnlineCalled) {
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                        fbird.removeListener(EVT_TOP.GAD_INCOMING, gadIncomingLsn);
                        done();
                    }
                },
                netChangeLsn = function (msg) {
                    if (msg.permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.status === 'online') {
                        devOnlineCalled = true;
                        checkDone();
                    } else if (msg.permAddr === 'AA:BB:CC:DD:EE:02' && msg.data.enabled === true) {
                        devEnableCalled = true;
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
                };

            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
            fbird.on(EVT_TOP.GAD_INCOMING, gadIncomingLsn);
            fbird.once(EVT_TOP.DEV_INCOMING, function (dev) {
                
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
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                        fbird.removeListener(EVT_BTM.NcGadIncoming, gadIncomingLsn);
                        fbird.removeListener(EVT_TOP.GAD_ATTRS_CHANGED, gadAttrsChangeLsn);
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

            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
            fbird.on(EVT_BTM.NcGadIncoming, gadIncomingLsn);
            fbird.on(EVT_TOP.GAD_ATTRS_CHANGED, gadAttrsChangeLsn);
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

            fbird.once(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
        });
    });

    describe('#event - devReporting', function () {
        it('device attribute reporting', function (done) {
            this.timeout(10000);
            var devReportingLsn = function (msg) {
                    var dev = fbird.findByNet('device', msg.ncName, msg.permAddr),
                        netAttrs = dev.get('attrs');

                    if (msg.data.version && _.isEqual(netAttrs.version.hw, msg.data.version.hw)) {
                        fbird.removeListener(EVT_TOP.DEV_REPORTING, devReportingLsn);
                        done();
                    }
                };

            fbird.on(EVT_TOP.DEV_REPORTING, devReportingLsn);
        });
    });

    describe('#event - gadReporting', function () {
        it('gadget attribute reporting', function (done) {
            this.timeout(10000);
            var gadReportingLsn = function (msg) {
                    var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                        gadAttrs = gad.get('attrs'),
                        attrKey = _.keys(msg.data)[0];

                    if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey]))
                        done();
                };

            fbird.once(EVT_TOP.GAD_REPORTING, gadReportingLsn);
        });

        it('gadget attribute reporting - appendFlag', function (done) {
            this.timeout(30000);

            fbird.once(EVT_BTM.GadAttrsAppend, function (msg) {
                var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                    gadAttrs = gad.get('attrs'),
                    attrKey = _.keys(msg.data)[0];

                if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey]))
                    done();
            });

            ncMock1._controller._gadAttrRandomChanges('gad', true);
        });
    });

    describe('#event - devLeaving', function () {
        it('device offline', function (done) {
            this.timeout(10000);
            var netChangeLsn = function (msg) {
                    if (msg.data.status === 'offline' && msg.permAddr === 'AA:BB:CC:DD:EE:02'){
                        fbird.permitJoin(0);
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                        done();
                    }
                };

            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

            ncMock1._controller._DeviceLeave('AA:BB:CC:DD:EE:02');
            fbird.permitJoin(60);
        });

        it('manually remove device', function (done) {
            this.timeout(10000);
            var removeCbCalled, devLeavingCalled,
                checkDone = function () {
                    if (removeCbCalled && devLeavingCalled)
                        done();
                },
                devLeavingLsn = function (msg) {
                    if (msg.ncName === 'mock01' && msg.permAddr === 'AA:BB:CC:DD:EE:01'){
                        fbird.removeListener(EVT_TOP.DEV_LEAVING, devLeavingLsn);
                        devLeavingCalled = true;
                        checkDone();
                    }
                };

            fbird.on(EVT_TOP.DEV_LEAVING, devLeavingLsn);

            fbird.remove('mock01', 'AA:BB:CC:DD:EE:01', function (err, permAddr) {
                if (!err && permAddr === 'AA:BB:CC:DD:EE:01') {
                    removeCbCalled = true;
                    checkDone();
                }
            });
        });
    });

    describe('#Device', function () {
        describe('#.read', function () {
            it(' ', function () {
            });
        });

        describe('#.write', function () {
            it(' ', function () {
            });
        });

        describe('#.identify', function () {
            it(' ', function () {
            });
        });
    });

    describe('#Gadget', function () {
        describe('#.read', function () {
            it(' ', function () {
            });
        });

        describe('#.write', function () {
            it(' ', function () {
            });
        });

        describe('#.exec', function () {
            it(' ', function () {
            });
        });
    });

});
