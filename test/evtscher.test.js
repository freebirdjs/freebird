var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect;

chai.use(sinonChai);

var EvtScher = require('../lib/components/evtscher');

var fakeFb = {
        emit: function () {}
    },
    evtScher = new EvtScher(fakeFb);

describe('evtScher - Functional Check', function () {
    describe('#enabled()', function () {
        it('should set enabled true and running false than _evts is empty', function (done) {
            evtScher.enable();

            if (evtScher._enabled && !evtScher._running)
                done();
        });
    });

    describe('#disabled()', function () {
        it('should set enabled false', function (done) {
            evtScher.disable();

            if (!evtScher._enabled)
                done();
        });
    });

    describe('#add(evtObj)', function () {
        it('should add evtObj to _evts but not run than enabled is false', function (done) {
            var evtObj = {
                    name: 'test',
                    msg: {
                        id: 0
                    }
                };

            evtScher.add(evtObj.name, evtObj.msg);

            if (evtScher._evts.find(function (evt) { return _.isEqual(evt, evtObj);})) {
                done();
            }
        });

        it('should add evtObj to _evts and run than enabled is true', function (done) {
            var emitStub = sinon.stub(fakeFb, 'emit', function (name, msg) {
                    if (name === 'test' && msg.id === 1)
                        done();
                }),
                evtObj = {
                    name: 'test',
                    msg: {
                        id: 1
                    }
                };

            evtScher.clear();
            evtScher.enable();
            evtScher.add(evtObj.name, evtObj.msg);
        });
    });

    describe('#clear()', function () {
        it('should clear evts', function (done) {
            evtScher.clear();

            if (evtScher._evts.length === 0)
                done();
        });
    });

    describe('#run()', function () {
        it('should not run then enabled is false', function (done) {
            evtScher.run();

            done();
        });
    });
});