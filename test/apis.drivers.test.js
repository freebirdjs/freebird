var chai = require('chai'),
    expect = chai.expect;

var drvApis = require('../lib/apis/driver');

var netDriverNames = [ 'start', 'stop', 'enable', 'disable', 'reset', 'permitJoin', 'remove', 'ban', 'unban', 'ping', 'maintain' ],
    devDriverNames = [ 'read', 'write', 'identify', 'enable', 'disable' ],
    gadDriverNames = [ 'read', 'write', 'exec', 'setReportCfg', 'getReportCfg', 'enable', 'disable' ];

describe('APIs - binding checks', function() {
    var freebirdMock = {
        net: {},
        dev: {},
        gad: {}
    };

    drvApis.bindDrivers(freebirdMock);

    describe('# check all net drivers are function', function() {
        it('should be attached to freebird.net', function () {
            var allFunc = true;
            netDriverNames.forEach(function (fnName) {
                allFunc = allFunc && (typeof freebirdMock.net[fnName] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all dev drivers are function', function() {
        it('should be attached to freebird.dev', function () {
            var allFunc = true;
            devDriverNames.forEach(function (fnName) {
                allFunc = allFunc && (typeof freebirdMock.dev[fnName] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all gad drivers are function', function() {
        it('should be attached to freebird.gad', function () {
            var allFunc = true;
            gadDriverNames.forEach(function (fnName) {
                allFunc = allFunc && (typeof freebirdMock.gad[fnName] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });
});