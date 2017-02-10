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
                    done();
                }
            };

            fbird.permitJoin(pjTime, function (err) {
                if (!err) checkCount += 1;
            });

            fbird.on(BTM_EVTS.NcPermitJoin, lsn);
            fbird.on(TOP_EVTS.NC_PERMIT_JOIN, lsn);
        });

        it('permitJoin again', function () {

        });

        it('permitJoin when netcore is disable', function () {

        });
    });


});