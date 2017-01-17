var chai = require('chai'),
    expect = chai.expect,
    _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var rpcApis = require('../lib/rpc/apis');

var fb = {
    findById: function () { 
        return 5; 
    }
};

describe('APIs - signature checks', function() {
    var apiNames = {
        net: [],
        dev: [],
        gad: []
    };

    for (var subSys in RPC.Api) {
        for (var apiName in RPC.Api[subSys]) {
            apiNames[subSys].push(apiName);
        }
    }

    describe('# check all net apis are function', function() {
        it('should throw if there is a lack of net apis', function () {
            var allFunc = true;
            apiNames.net.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis[apiName] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all dev apis are function', function() {
        it('should throw if there is a lack of dev apis', function () {
            var allFunc = true;
            apiNames.dev.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis['dev' + _.upperFirst(apiName)] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    describe('# check all gad apis are function', function() {
        it('should throw if there is a lack of gad apis', function () {
            var allFunc = true;
            apiNames.gad.forEach(function (apiName) {
                allFunc = allFunc && (typeof rpcApis['gad' + _.upperFirst(apiName)] === 'function')
            });
            expect(allFunc).to.be.true;
        });
    });

    for (var rpcApi in rpcApis) {
        rpcApis[rpcApi] = rpcApis[rpcApi].bind(fb);
    }


    // subSys: 'net'

    // subSys: 'dev'
    describe('#enable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devEnable({}, cb);
            rpcApis.devEnable({ id: {} }, cb);
            rpcApis.devEnable({ id: [] }, cb);
            rpcApis.devEnable({ id: true }, cb);
            rpcApis.devEnable({ id: null }, cb);
        });
    });

    

    describe('#disable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devDisable({}, cb);
            rpcApis.devDisable({ id: {} }, cb);
            rpcApis.devDisable({ id: [] }, cb);
            rpcApis.devDisable({ id: true }, cb);
            rpcApis.devDisable({ id: null }, cb);
        });
    });

    describe('#read(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devRead({ attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: {}, attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: [], attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: true, attrName: 'xxx' }, cb);
            rpcApis.devRead({ id: null, attrName: 'xxx' }, cb);
        });

        it('should has error if args.attrName is not string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devRead({ id: 'xxx' }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: true }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: [] }, cb);
            rpcApis.devRead({ id: 'xxx', attrName: {} }, cb); 
            rpcApis.devRead({ id: 'xxx', attrName: null }, cb); 
        });
    });

    describe('#write(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devWrite({ attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: {}, attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: [], attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: true, attrName: 'xxx' }, cb);
            rpcApis.devWrite({ id: null, attrName: 'xxx' }, cb);
        });

        it('should has error if args.attrName is not string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devWrite({ id: 'xxx' }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: true }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: [] }, cb);
            rpcApis.devWrite({ id: 'xxx', attrName: {} }, cb); 
            rpcApis.devWrite({ id: 'xxx', attrName: null }, cb); 
        });
    });

    describe('#identify(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devIdentify({}, cb);
            rpcApis.devIdentify({ id: {} }, cb);
            rpcApis.devIdentify({ id: [] }, cb);
            rpcApis.devIdentify({ id: true }, cb);
            rpcApis.devIdentify({ id: null }, cb);
        });
    });

    describe('#getProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devGetProps({}, cb);
            rpcApis.devGetProps({ id: {} }, cb);
            rpcApis.devGetProps({ id: [] }, cb);
            rpcApis.devGetProps({ id: true }, cb);
            rpcApis.devGetProps({ id: null }, cb);
        });

        it('should has error if args.propNames is exist and not a array of string', function (done) {
            var errMsg = 'propNames should be an array of string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devGetProps({ id: 'xxx', propNames: 'xxx' }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: 0 }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: {} }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: true }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: [ 1, 2, 3] }, cb);
            rpcApis.devGetProps({ id: 'xxx', propNames: [true, 'xxx'] }, cb);
        });
    });

    describe('#setProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devSetProps({ props: {} }, cb);
            rpcApis.devSetProps({ id: {}, props: {} }, cb);
            rpcApis.devSetProps({ id: [], props: {} }, cb);
            rpcApis.devSetProps({ id: true, props: {} }, cb);
            rpcApis.devSetProps({ id: null, props: {} }, cb);
        });

        it('should has error if args.props is not a object', function (done) {
            var errMsg = 'props should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.devSetProps({ id: 'xxx' }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: 'xxx' }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: 3 }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: [] }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: true }, cb);
            rpcApis.devSetProps({ id: 'xxx', props: null }, cb);
        });
    });

    describe('#ping(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devPing({ }, cb);
            rpcApis.devPing({ id: {} }, cb);
            rpcApis.devPing({ id: [] }, cb);
            rpcApis.devPing({ id: true }, cb);
            rpcApis.devPing({ id: null }, cb);
        });
    });

    describe('#remove(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.devRemove({ }, cb);
            rpcApis.devRemove({ id: {} }, cb);
            rpcApis.devRemove({ id: [] }, cb);
            rpcApis.devRemove({ id: true }, cb);
            rpcApis.devRemove({ id: null }, cb);
        });
    });


    // subSys: 'gad'
    describe('#enable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadEnable({ }, cb);
            rpcApis.gadEnable({ id: {} }, cb);
            rpcApis.gadEnable({ id: [] }, cb);
            rpcApis.gadEnable({ id: true }, cb);
            rpcApis.gadEnable({ id: null }, cb);
        });
    });

    describe('#disable(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadDisable({ }, cb);
            rpcApis.gadDisable({ id: {} }, cb);
            rpcApis.gadDisable({ id: [] }, cb);
            rpcApis.gadDisable({ id: true }, cb);
            rpcApis.gadDisable({ id: null }, cb);
        });
    });

    describe('#read(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadRead({ }, cb);
            rpcApis.gadRead({ id: {} }, cb);
            rpcApis.gadRead({ id: [] }, cb);
            rpcApis.gadRead({ id: true }, cb);
            rpcApis.gadRead({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadRead({ id: 'xxx' }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadRead({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#write(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadWrite({ }, cb);
            rpcApis.gadWrite({ id: {} }, cb);
            rpcApis.gadWrite({ id: [] }, cb);
            rpcApis.gadWrite({ id: true }, cb);
            rpcApis.gadWrite({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWrite({ id: 'xxx' }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadWrite({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#exec(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadExec({ }, cb);
            rpcApis.gadExec({ id: {} }, cb);
            rpcApis.gadExec({ id: [] }, cb);
            rpcApis.gadExec({ id: true }, cb);
            rpcApis.gadExec({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadExec({ id: 'xxx' }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: true }, cb);
        });

        it('should has error if args.param is exist and not a array', function (done) {
            var errMsg = 'params should be an array',
                cb = getCheckedCb(4, errMsg, done);

            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: 'xxx' }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: {} }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: true }, cb);
            rpcApis.gadExec({ id: 'xxx', attrName: 'xxx', params: 3 }, cb);
        });
    });

    describe('#readReportCfg(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadReadReportCfg({ }, cb);
            rpcApis.gadReadReportCfg({ id: {} }, cb);
            rpcApis.gadReadReportCfg({ id: [] }, cb);
            rpcApis.gadReadReportCfg({ id: true }, cb);
            rpcApis.gadReadReportCfg({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadReadReportCfg({ id: 'xxx' }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadReadReportCfg({ id: 'xxx', attrName: true }, cb);
        });
    });

    describe('#writeReportCfg(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadWriteReportCfg({ }, cb);
            rpcApis.gadWriteReportCfg({ id: {} }, cb);
            rpcApis.gadWriteReportCfg({ id: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: true }, cb);
            rpcApis.gadWriteReportCfg({ id: null }, cb);
        });

        it('should has error if args.attrName is not a string', function (done) {
            var errMsg = 'attrName should be a string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWriteReportCfg({ id: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 0 }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: {} }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: null }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: true }, cb);
        });

        it('should has error if args.rptCfg is not an object', function (done) {
            var errMsg = 'rptCfg should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: 5 }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: 'xxx' }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: [] }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: true }, cb);
            rpcApis.gadWriteReportCfg({ id: 'xxx', attrName: 'xxx', rptCfg: null }, cb);
        });
    });

    describe('#getProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadGetProps({ }, cb);
            rpcApis.gadGetProps({ id: {} }, cb);
            rpcApis.gadGetProps({ id: [] }, cb);
            rpcApis.gadGetProps({ id: true }, cb);
            rpcApis.gadGetProps({ id: null }, cb);
        });

        it('should has error if args.propNames is exist and not a array of string', function (done) {
            var errMsg = 'propNames should be an array of string',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadGetProps({ id: 'xxx', propNames: 'xxx' }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: 0 }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: {} }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: true }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: [ 1, 2, 3] }, cb);
            rpcApis.gadGetProps({ id: 'xxx', propNames: [true, 'xxx'] }, cb);
        });
    });

    describe('#setProps(args, callback)', function () {
        it('should has error if args.id is not number', function (done) {
            var errMsg = 'id should be a number or a string',
                cb = getCheckedCb(5, errMsg, done);

            rpcApis.gadSetProps({ props: {} }, cb);
            rpcApis.gadSetProps({ id: {}, props: {} }, cb);
            rpcApis.gadSetProps({ id: [], props: {} }, cb);
            rpcApis.gadSetProps({ id: true, props: {} }, cb);
            rpcApis.gadSetProps({ id: null, props: {} }, cb);
        });

        it('should has error if args.props is not a object', function (done) {
            var errMsg = 'props should be an object',
                cb = getCheckedCb(6, errMsg, done);

            rpcApis.gadSetProps({ id: 'xxx' }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: 'xxx' }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: 3 }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: [] }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: true }, cb);
            rpcApis.gadSetProps({ id: 'xxx', props: null }, cb);
        });
    });

});

function getCheckedCb (times, errMsg, done) {
    var checkNum = 0,
        cbCalled = false;

    return function (err) {
        if (err && (err instanceof TypeError) && (err.message === errMsg))
            checkNum += 1;

        if (cbCalled) {
            done();
        }

        if (checkNum === times) {
            cbCalled = true;
            done();
        }
    }; 
}
