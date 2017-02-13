var fs = require('fs'),
    path = require('path');

var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    mockup = require('freebird-netcore-mockup'),
    FbConst = require('freebird-constants');

chai.use(sinonChai);

try {
    fs.unlinkSync(path.resolve('../database/devices.db'));
    fs.unlinkSync(path.resolve('../database/gadgets.db'));
} catch (e) {
    console.log(e);
}

var Freebird = require('../index');

var ncMock1 = mockup('mock01'),
    ncMock2 = mockup('mock02', true),
    fbird = new Freebird([ncMock1, ncMock2]);

describe('Intergration test', function () {
    this.timeout(5000);

    before(function (done) {
        fbird.once(FbConst.EVENTS_TO_TOP.GAD_INCOMING, function () {
            done();
        });    

        fbird.start(function () {
            fbird.permitJoin(60);
        });
    });

    describe('#.ping()', function () {
        it('should has callback msg when device is in fb', function (done) {
            var id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

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
        it('should call all controllers gadRead', function () {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

        });

        it('should call one controller gadRead', function () {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

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
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

            fbird.on(FbConst.EVENTS_TO_TOP.DEV_LEAVING, function () {
                nc._controller._reloadheldDevice();
                nc._controller._newDevice();
                fbird.once(FbConst.EVENTS_TO_TOP.GAD_INCOMING, function () {
                    done();
                });    
            });

            fbird.remove('mock01', permAddr, function (err, msg) {
                console.log(err);
                expect(msg).to.be.eql('remove_' + permAddr);
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
});
