var util = require('util'),
    events = require('events'),
    http = require('http'),
    _ = require('lodash'),
    WebsocketServer = require('ws').Server;

var wsServer = {
    _freebird = null;
    _wsServer = null;
    _wsClients = [];
}

wsServer.initialize = function (server) {
    var self = this;

    this._wsServer = new WebsocketServer({server});

    this._wsServer.on('connection', function (ws) {
        ws.on('message', function (msg) {
            msg = self._freebird.decrypt(msg);
            msg = JSON.parse(msg);

            if (msg.type === 'authenticate') {
                ws._auth = false;
                self._freebird.authenticate(ws, msg.data, function (err, success) {
                    if (success) {
                        ws._auth = true;
                        self._wsClients.push(ws);
                    } else if (err) {
                        ws.close(401, err);
                        delete self._wsClients[_.indexOf(self._wsClients, ws)];
                    } else {
                        ws.close(401, 'Authentication failure');
                        delete self._wsClients[_.indexOf(self._wsClients, ws)];
                    }
                });
            } else {
                if (ws._auth)
                    self._reqHdlr(ws, msg);
            }
        });
    });

    this._wsServer.on('error', function() {});
}

wsServer._reqHdlr = function (ws, data) {
    this._freebird.authorize(ws, function (err, success) {
        if (success) {
            // call Api
        } else if (err) {

        } else {

        }
    });
}

wsServer.sendRsp = function(ws, reqMsg, rspCode, rspData) {
    var rspMsg

    reqMsg._intf = 'RSP';
    reqMsg.status = rspCode;
    reqMsg.data = rspData;

    delete reqMsg.arg;

    rspMsg = JSON.stringify(reqMsg);

    ws.send(this._freebird.encrypt(rspMsg));
}

wsServer.sendInd = function(evtType) {
    var self = this,
        indMsg = {
            _intf: 'IND'
            subsys: null,
            type: null,
            id: null,
            data: null
        };

    _.forEach(self._wsClients, function (wsClient) {
        self._freebird.authorize(wsClient, function (err, success) {

        });
    });
}


module.exports = wsServer;
