var path = require('path');

var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    mockup = require('freebird-netcore-mockup');

chai.use(sinonChai);

var Freebird = require('../index');

var ncMock1 = mockup('mock01'),
    ncMock2 = mockup('mock02', true),
    fbird = new Freebird([ncMock1, ncMock2]);

describe('Intergration test', function () {
    before(function (done) {
        var nc1 = fbird.findByNet('netcore', 'mock01'),
            nc2 = fbird.findByNet('netcore', 'mock02');

        fbird.on('NcDevIncoming', function () {
            done();
        });    

        nc1.start(function () {
            nc2.start(function () {
                nc1.permitJoin(30);
            });
        });
    });

    describe('#.ping()', function () {
        it('should has callback msg when device is in fb', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                mac = fbird._devbox.get(id).mac;

            nc.ping(mac, function (err, msg) {
                expect(msg).to.be.eql('ping_' + mac);
                done();
            });
        });

        it('should has err msg when nc is disable', function (done) {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                mac = fbird._devbox.get(id).mac;

            nc.ping(mac, function (err, msg) {
                if (err)
                    done();
            });
        });
    });

    describe('#.maintain()', function () {
        it('should call all controllers gadRead', function () {
            var nc = fbird.findByNet('netcore', 'mock01');

        });

        it('should call one controller gadRead', function () {
            var nc = fbird.findByNet('netcore', 'mock01');

        });

        it('should has err msg when nc is disable', function () {
            var nc = fbird.findByNet('netcore', 'mock01');

        });
    });

    describe('#.remove()', function () {
        it('should has callback msg and NcDevLeaving event when device is in fb', function () {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                mac = fbird._devbox.get(id).mac;

        });

        it('should has err msg when nc is disable', function () {
            var nc = fbird.findByNet('netcore', 'mock01'),
                id = fbird._devbox.exportAllIds()[0],
                mac = fbird._devbox.get(id).mac;

        });
    });

    describe('#.readReportCfg()', function () {
        it('should has callback msg', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);
            
        });

        it('should has err msg when nc is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });

        it('should has err msg when dev is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });

        it('should has err msg when gad is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });
    });

    describe('#.writeReportCfg()', function () {
        it('should has callback msg', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);
            
        });

        it('should has err msg when nc is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });

        it('should has err msg when dev is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });

        it('should has err msg when gad is disable', function () {
            var id = fbird._devbox.exportAllIds()[0],
                dev = fbird.findById('device', id);

        });
    });
});
