var _ = require('busyman'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect;

chai.use(sinonChai);

var EvtScher = require('../lib/components/evtscheduler');

var fakeFb = {
        emit: function () {}
    },
    evtScher = new EvtScher(fakeFb);

describe('evtScher - Functional Check', function () {
    describe('#enabled()', function () {
        it('should set enabled true and not run than _evts is empty', function (done) {
            evtScher.enable();

            if (evtScher._enabled && !evtScher._running)
                done();
        });

        it('should set enabled true and run than _evts has evtObj', function (done) {
            var emitStub = sinon.stub(fakeFb, 'emit', function (name, msg) {
                    if (name === 'test' && msg.id === 0) {
                        emitStub.restore();
                        done();
                    }
                }),
                evtObj = {
                    name: 'test',
                    msg: {
                        id: 0
                    }
                };

            evtScher.disable();
            evtScher.add(evtObj.name, evtObj.msg);
            evtScher.enable();
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

            evtScher.disable();
            evtScher.add(evtObj.name, evtObj.msg);

            if (evtScher._evts.find(function (evt) { return _.isEqual(evt, evtObj);})) {
                done();
            }
        });

        it('should add evtObj to _evts and run than enabled is true', function (done) {
            var emitStub = sinon.stub(fakeFb, 'emit', function (name, msg) {
                    if (name === 'test' && msg.id === 1) {
                        emitStub.restore();
                        done();
                    }
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

        it('should add evtObj to _evts and not call run because running', function (done) {
            var emitStub = sinon.stub(fakeFb, 'emit', function (name, msg) {
                    if (name === 'test' && msg.id === 2) {
                        expect(fakeFb.emit).to.have.been.calledThrice;
                        emitStub.restore();
                        done();
                    }
                }),
                evtObj1 = {
                    name: 'test',
                    msg: {
                        id: 1
                    }
                },
                evtObj2 = {
                    name: 'test',
                    msg: {
                        id: 2
                    }
                };

            evtScher.disable();
            evtScher.add(evtObj1.name, evtObj1.msg);
            evtScher.add(evtObj1.name, evtObj1.msg);
            evtScher.enable();
            evtScher.add(evtObj2.name, evtObj2.msg);
        });
    });

    describe('#clear()', function () {
        it('should clear evts', function (done) {
            evtScher.clear();

            if (evtScher._evts.length === 0)
                done();
        });
    });
});