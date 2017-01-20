var EventEmitter = require('events'),
    transp_1 = new EventEmitter(),
    fb = new EventEmitter();

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    _ = require('busyman'),
    RPC = require('freebird-constants').RPC;

var Agent = require('../lib/rpc/agent'),
    apiAgent = new Agent(fb);

fb._fire = function (evt, data) {
    var self = this;
    setImmediate(function () {
        self.emit(evt, data);
    });
};

fb.findById = function (type, id) {};

describe('APIs - methods checks', function() {
    describe('#.addTransport', function() {
        it('should has error if transp.send is not a function', function (done) {
            apiAgent.addTransport('transp_1', transp_1, function (err) {
                if (err.message === 'Invalid transp object') {
                    transp_1.send = function () {};
                    done();
                }
            });
        });

        it('should has error if transp.broadcast is not a function', function (done) {
            apiAgent.addTransport('transp_1', transp_1, function (err) {
                if (err.message === 'Invalid transp object') {
                    transp_1.broadcast = function () {};
                    done();
                }
            });
        });

        it('add transport successfully', function (done) {
            apiAgent.addTransport('transp_1', transp_1, function (err) {
                if (!err)
                    done();
            });
        });

        it('should has error if name of transportation conflicts', function (done) {
            apiAgent.addTransport('transp_1', transp_1, function (err) {
                if (err.message === 'name of transportation conflicts: transp_1')
                    done();
            });
        });
    });

    describe('#.parseIncomingMessage', function() {
        it('should has error if msg.data is not a buffer or a json string', function (done) {
            var msg = {
                data: '{ __intf: "REQ" }'
            };

            apiAgent.parseIncomingMessage(msg, function (result) {
                if (!result.valid && result.data === '{ __intf: "REQ" }')
                    done();
            });
        });

        it('msg.data should be a buffer', function (done) {
            var msg = {
                data: new Buffer('{ "__intf": "REQ", "subsys": "net", "seq": 3, "id": 0, "cmd": "getDevs", "args": { "ids": [ 2, 4, 18, 61 ] } }')
            };

            apiAgent.parseIncomingMessage(msg, function (result) {
                if (result.valid)
                    done();
            });
        });

        it('msg.data should be the json string', function (done) {
            var msg = {
                data: '{ "__intf": "REQ", "subsys": "net", "seq": 3, "id": 0, "cmd": "getDevs", "args": { "ids": [ 2, 4, 18, 61 ] } }'
            };

            apiAgent.parseIncomingMessage(msg, function (result) {
                if (result.valid)
                    done();
            });
        });
    });

    describe('#.incomingMessageHandler', function() {
        it('should call incomingMessageHandler function', function (done) {
            var incomingMessageHandlerStub = sinon.stub(apiAgent, 'incomingMessageHandler', function (transp, msg) {
                    if (transp._name === 'transp_1' && msg === 'abc') {
                        incomingMessageHandlerStub.restore();
                        done();
                    }
                });

            transp_1.emit('message', 'abc');
        });

        it('should emit error unhandledMessage', function (done) {
            var emitMsg = {
                    clientId: 1,
                    data: '{ "__intf": "REQ" }'
                };

            transp_1.once('unhandledMessage', function (msg) {
                if (_.isEqual(msg, emitMsg))
                    done();
            });

            transp_1.emit('message',emitMsg);
        });

        it('should call transp_1.send function', function (done) {
            var transpSendStub = sinon.stub(transp_1, 'send', function (msg) {
                    if (msg.clientId === 2) {
                        incomingRequestHandlerStub.restore();
                        transpSendStub.restore();
                        done();
                    }
                }),
                incomingRequestHandlerStub = sinon.stub(apiAgent, 'incomingRequestHandler', function (transp, reqObj, callback) {
                    var rsp = {
                        __intf: 'RSP',
                        subsys: reqObj.subsys,
                        seq: reqObj.seq,
                        id: reqObj.id,
                        cmd: reqObj.cmd,
                        status: 0,
                        data: null
                    };
                    callback(rsp);
                }),
                emitMsg = {
                    clientId: 2,
                    data: '{ "__intf": "REQ", "subsys": "net", "seq": 3, "id": 0, "cmd": "getDevs", "args": { "ids": [ 2, 4, 18, 61 ] } }'
                };

            transp_1.emit('message',emitMsg);
        });
    });

    describe('#.incomingRequestHandler', function() {
        it('should has error if no such cmd', function (done) {
            var reqObj = { "__intf": "REQ", "subsys": "net", "seq": 3, "id": 0, "cmd": "xxx", "args": { "ids": [ 2, 4, 18, 61 ] } };

            apiAgent.incomingRequestHandler(transp_1, reqObj, function (rsp) {
                if (rsp.status === RPC.Status.BadRequest)
                    done();
            });
        });

        it('should has warn if call apis error', function (done) {
            var reqObj = { "__intf": "REQ", "subsys": "dev", "seq": 3, "id": 0, "cmd": "enable", "args": { "ids": [ 2, 4, 18, 61 ] } },
                warned = false,
                cbCalled = false;

            fb.once('warn', function (err) {
                if (err.message === 'id should be a number or a string') {
                    warned = true;
                    if (cbCalled)
                        done();
                }
            });

            apiAgent.incomingRequestHandler(transp_1, reqObj, function (rsp) {
                if (rsp.status === RPC.Status.BadRequest) {
                    cbCalled = true;
                    if (warned)
                        done();
                }
            });
        });

        it('should call apis cmd', function (done) {
            var reqObj = { "__intf": "REQ", "subsys": "net", "seq": 3, "id": 0, "cmd": "getDevs", "args": { "ids": [ 2, 4, 18, 61 ] } };

            apiAgent.incomingRequestHandler(transp_1, reqObj, function (rsp) {
                if (rsp.status === RPC.Status.Content)
                    done();
            });
        });
    });

    describe('#.indicate', function() {
        it('should call transp_1.broadcast function', function (done) {
            var transpBroadcastStub = sinon.stub(transp_1, 'broadcast', function (msg, callback) {
                    callback(null, 0);
                }),
                ind = { __intf: 'IND', subsys: 'net', type: 'xxx', id: 6, data: {} };

            apiAgent.indicate(ind, function (err) {
                if (!err)
                    done();
            });
        });
    });
});
