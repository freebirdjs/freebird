var util = require('util');
var _ = require('busyman');
var http = require('http');
var ncMock = require('freebird-netcore-mockup');
var FBCONST = require('freebird-constants');

var Freebird = require('../index');

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

        it('check NcBannedGadIncoming when gadget of banned device join the network', function () {

        });

        it('check NcBannedDevReporting when banned device reporting', function () {

        });

        it('check NcBannedGadReporting when gadget of banned device reporting', function () {

        });
    });
});