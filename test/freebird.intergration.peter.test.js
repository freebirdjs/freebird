var fs = require('fs'),
    path = require('path'),
    http = require('http');

var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    mockup = require('freebird-netcore-mockup'),
    FbConst = require('freebird-constants'),
    fbRpc = require('freebird-rpc');

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
    fbird = new Freebird([ncMock1, ncMock2]),
    httpServer = http.createServer();

httpServer.listen(3000);

var rpcServer = fbRpc.createServer(httpServer),
    rpcClient = fbRpc.createClient('ws://localhost:3000');

fbird.addTransport('rpc1', rpcServer, function (err) {
    if (err) console.log(err);
});

describe('Intergration test', function () {
    this.timeout(5000);

    before(function (done) {
        fbird.once(FbConst.EVENTS_TO_TOP.GAD_INCOMING, function () {
            setTimeout(function () {
                done();
            }, 500);
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
                dev = fbird._devbox.get(id),
                permAddr = dev._net.address.permanent,
                auxId = dev._gads[0].auxId,
                gad = fbird.findByNet('gadget', 'mock01', permAddr, auxId),
                attrName = _.keys(gad._attrs)[0],
                devAttrData = {},
                gadAttrData = {};

            devAttrData.model = 'xxx';
            gadAttrData[attrName] = 'xxx';
            dev.set('attrs', devAttrData);
            gad.set('attrs', gadAttrData);

            function devEventTestFunction(msg) {
                if (msg._data.model === 'xxx') {
                    fbird.removeListener(FbConst.EVENTS_TO_TOP.DEV_ATTRS_CHANGED, devEventTestFunction);
                    expect(msg.data.model).to.be.eql('devRead_' + msg.permAddr + '_' + 'model');
                }
            }

            function gadEventTestFunction(msg) {
                if (msg._data[attrName] === 'xxx') {
                    fbird.removeListener(FbConst.EVENTS_TO_TOP.GAD_ATTRS_CHANGED, gadEventTestFunction);
                    expect(msg.data[attrName]).to.be.eql('gadRead_' + msg.permAddr + '_' + auxId + '_' + attrName);
                }
            }

            fbird.on(FbConst.EVENTS_TO_TOP.DEV_ATTRS_CHANGED, devEventTestFunction);
            fbird.on(FbConst.EVENTS_TO_TOP.GAD_ATTRS_CHANGED, gadEventTestFunction);

            function rpcTestFunction(msg) {
                if (msg.subsys === 2 && msg.type === 'attrsChanged' && msg.data[attrName] === 'gadRead_' + permAddr + '_' + auxId + '_' + attrName) {
                    rpcClient.removeListener('ind', rpcTestFunction);
                    done();
                }
            }

            rpcClient.on('ind', rpcTestFunction);

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
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                permAddr = fbird._devbox.get(id)._net.address.permanent;

            fbird.once(FbConst.EVENTS_TO_TOP.DEV_LEAVING, function () {
                nc._controller._reloadheldDevice();
                nc._controller._newDevice();
                fbird.once(FbConst.EVENTS_TO_TOP.GAD_INCOMING, function () {
                    done();
                });    
            });

            function rpcTestFunction(msg) {
                if (msg.type === 'devLeaving') {
                    rpcClient.removeListener('ind', rpcTestFunction);
                    expect(msg.subsys).to.be.eql(1);
                    expect(msg.id).to.be.eql(id);
                    expect(msg.data.netcore).to.be.eql('mock01');
                    expect(msg.data.permAddr).to.be.eql('AA:BB:CC:DD:EE:01');  
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
