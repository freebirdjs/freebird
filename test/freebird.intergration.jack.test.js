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

var rpcServer = fbRpc.createServer(httpServer),
    rpcClient = fbRpc.createClient('ws://localhost:3000');

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
            this.timeout(10000);
            if (fbird._getState() === FB_STATE.UNKNOW) {
                var nc1startCalled, nc2startCalled,
                    nc1enabledCalled, nc2enabledCalled,
                    fbReadyCalled, startCalled,
                    rpcNc1enabled, rpcNc2enabled, rpcNc1started, rpcNc2started,
                    checkDone = function () {
                        if (nc1startCalled && nc2startCalled && nc1enabledCalled && nc2enabledCalled && fbReadyCalled &&
                            startCalled && rpcNc1enabled && rpcNc2enabled && rpcNc1started && rpcNc2started) {
                            fbird.removeListener(EVT_TOP.NC_STARTED, ncStartLsn);
                            fbird.removeListener(EVT_TOP.NC_ENABLED, ncEnabledLsn);
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
            this.timeout(30000);
            var incomingCalled, devEnableCalled, devOnlineCalled, topLsnCalled,
                rpcDevIncoming, rpcDevOnline, rpcDevEnable,
                checkDone = function () {
                    if (incomingCalled && devEnableCalled && devOnlineCalled && topLsnCalled) {
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
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
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
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
            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

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
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                        fbird.removeListener(EVT_TOP.GAD_INCOMING, gadIncomingLsn);
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
            this.timeout(15000);
            var gadReporting, rpcGadReporting,
                gadReportingLsn = function (msg) {
                    var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                        gadAttrs = gad.get('attrs'),
                        attrKey = _.keys(msg.data)[0];

                    if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
                        gadReporting = true;
                        if (gadReporting && rpcGadReporting)
                            done();
                    }
                },
                topLsn = function (msg) {
                    if (msg.subsys === 'gad' && msg.type === 'attrsReport') {
                        rpcClient.removeListener('ind', topLsn);
                        var gad = fbird.findById('gadget', msg.id),
                            gadAttrs = gad.get('attrs'),
                            attrKey = _.keys(msg.data)[0];

                        if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
                            rpcGadReporting = true;
                            if (gadReporting && rpcGadReporting)
                                done();
                        }
                    }
                };

            rpcClient.on('ind', topLsn);
            fbird.once(EVT_TOP.GAD_REPORTING, gadReportingLsn);
        });

        it('gadget attribute reporting - appendFlag', function (done) {
            this.timeout(15000);
            var gadAttrsAppendCalled, rpcGadReporting,
                topLsn = function (msg) {
                    if (msg.subsys === 'gad' && msg.type === 'attrsChanged') {
                        rpcClient.removeListener('ind', topLsn);
                        var gad = fbird.findById('gadget', msg.id),
                            gadAttrs = gad.get('attrs'),
                            attrKey = _.keys(msg.data)[0];

                        if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
                            rpcGadReporting = true;
                            if (gadAttrsAppendCalled && rpcGadReporting)
                                done();
                        }
                    }
                };

            rpcClient.on('ind', topLsn);
            fbird.once(EVT_BTM.GadAttrsAppend, function (msg) {
                var gad = fbird.findByNet('gadget', msg.ncName, msg.permAddr, msg.auxId),
                    gadAttrs = gad.get('attrs'),
                    attrKey = _.keys(msg.data)[0];

                if (_.isEqual(gadAttrs[attrKey], msg.data[attrKey])) {
                    gadAttrsAppendCalled = true;
                    if (gadAttrsAppendCalled && rpcGadReporting)
                        done();
                }
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
            var removeCbCalled, devLeavingCalled, netChangeCalled, rpcDevLeaving, rpcAllLeaving,
                rpcIlluminanceLeaving, rpcLightCtrlLeaving, rpcMagnetometerLeaving,
                checkDone = function () {
                    if (removeCbCalled && devLeavingCalled && netChangeCalled && rpcAllLeaving)
                        done();
                },
                devLeavingLsn = function (msg) {
                    if (msg.ncName === 'mock01' && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                        fbird.removeListener(EVT_TOP.DEV_LEAVING, devLeavingLsn);
                        devLeavingCalled = true;
                        checkDone();
                    }
                },
                netChangeLsn = function (msg) {
                    if (msg.data.status === 'online' && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                        fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                        netChangeCalled = true;
                        checkDone();
                    }
                },
                topLsn = function (msg) {
                    if (msg.subsys === 'dev' && msg.type === 'devLeaving') {
                        if (msg.data.netcore === ncMock1.getName() && msg.data.permAddr === 'AA:BB:CC:DD:EE:01')
                            rpcDevLeaving = true;
                    } else if (msg.subsys === 'gad' && msg.type === 'gadLeaving' && msg.data.permAddr === 'AA:BB:CC:DD:EE:01') {
                        if (msg.data.auxId === 'illuminance/0')
                            rpcIlluminanceLeaving = true;
                        else if (msg.data.auxId === 'lightCtrl/0')
                            rpcLightCtrlLeaving = true;
                        else if (msg.data.auxId === 'magnetometer/0')
                            rpcMagnetometerLeaving = true;
                    }

                    if (rpcDevLeaving && rpcIlluminanceLeaving && rpcLightCtrlLeaving && rpcMagnetometerLeaving) {
                        rpcClient.removeListener('ind', topLsn);
                        rpcAllLeaving = true;
                        checkDone();
                    }
                };

            rpcClient.on('ind', topLsn);
            fbird.on(EVT_TOP.DEV_LEAVING, devLeavingLsn);
            fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

            fbird.remove('mock01', 'AA:BB:CC:DD:EE:01', function (err, permAddr) {
                if (!err && permAddr === 'AA:BB:CC:DD:EE:01') {
                    removeCbCalled = true;
                    checkDone();
                }
            });
            fbird.permitJoin(60);
        });
    });

    describe('#Device', function () {
        describe('#.read', function () {
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
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            dev.read('model', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('read device attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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

        describe('#.write', function () {
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
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            dev.write('model', 'lwmqn-7688-happy-duo', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('write device attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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

        describe('#.identify', function () {  // controller.js L403
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
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            dev.identify(function (err) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('identify device, but netcore disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:02');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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
                this.timeout(10000);
                var readCbCalled, rpcPanelChanged,
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    gadChangeLsn = function (msg) {
                        if (msg.permAddr === 'AA:BB:CC:DD:EE:01' && msg.auxId === 'illuminance/0' && msg.data.enabled === false) {
                            fbird.removeListener(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

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
                fbird.on(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('read gadget attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            gad.read('sensorValue', function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('read gadget attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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
                            fbird.removeListener(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

                            gad.write('sensorValue', 18, function (err, data) {
                                if (err.message === 'Gadget disabled.') {
                                    gad.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('write gadget attribute, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            gad.write('sensorValue', 18, function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('write gadget attribute, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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
                            fbird.removeListener(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

                            gad.exec('blink', [ 10 ], function (err, data) {
                                if (err.message === 'Gadget disabled.') {
                                    gad.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.GAD_PANEL_CHANGED, gadChangeLsn);

                gad.disable();
            });

            it('execute gadget, but device disabled', function (done) {
                this.timeout(5000);
                var dev = fbird.findByNet('device', 'mock01', 'AA:BB:CC:DD:EE:01'),
                    gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0'),
                    netChangeLsn = function (msg) {
                        if (msg.data.enabled === false && msg.permAddr === 'AA:BB:CC:DD:EE:01') {
                            fbird.removeListener(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);

                            gad.exec('blink', [ 10 ], function (err, data) {
                                if (err.message === 'Device disabled.') {
                                    dev.enable();
                                    done();
                                }
                            });
                        }
                    };

                fbird.on(EVT_TOP.DEV_NET_CHANGED, netChangeLsn);
                dev.disable();
            });

            it('execute gadget, but netcore disabled', function (done) {
                this.timeout(5000);
                var gad = fbird.findByNet('gadget', 'mock01', 'AA:BB:CC:DD:EE:01', 'illuminance/0');

                fbird.once(EVT_TOP.NC_DISABLED, function (msg) {
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
});
