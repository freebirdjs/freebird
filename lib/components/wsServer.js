var util = require('util'),
    events = require('events'),
    http = require('http'),
    _ = require('lodash'),
    WebsocketServer = require('ws').Server;

function WsServer (fb) {
    if (!fb) throw new Error('freebird should be given when new WsServer()');

    this._fb = fb;
    this._wsServer = null;
    this._wsClients = [];

    // add freebird event listener
    this._fb.on('permitJoin', this.onPermitJoin.bind(this));
    this._fb.on('netChanged', this.onNetChanged.bind(this));
    this._fb.on('statusChanged', this.onStatusChanged.bind(this));
    this._fb.on('devIncoming', this.onDevIncoming.bind(this));
    this._fb.on('devLeaving', this.onDevLeaving.bind(this));
    this._fb.on('gadIncoming', this.onGadIncoming.bind(this));
    this._fb.on('gadLeaving', this.onGadLeaving.bind(this));
    this._fb.on('attrReport', this.onAttrReport.bind(this));
    this._fb.on('devAttrsChanged', this.onDevAttrsChanged.bind(this));
    this._fb.on('gadAttrsChanged', this.onGadAttrsChanged.bind(this));
}

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
wsServer.prototype.initialize = function (server) {
    var self = this;

    this._wsServer = new WebsocketServer({server});

    this._wsServer.on('connection', function (wsClient) {
        wsClient.on('message', function (msg) {
            msg = self._fb.decrypt(msg);
            msg = JSON.parse(msg);

            if (msg.type === 'authenticate') {
                wsClient._auth = false;
                self._fb.authenticate(wsClient, msg.data, function (err, success) {
                    if (success) {
                        wsClient._auth = true;
                        if (!_.indexOf(self._wsClients, wsClient))
                            self._wsClients.push(wsClient);
                    } else if (err) {
                        wsClient.close(401, err);
                        delete self._wsClients[_.indexOf(self._wsClients, wsClient)];
                    } else {
                        wsClient.close(401, 'Authentication failure');
                        delete self._wsClients[_.indexOf(self._wsClients, wsClient)];
                    }
                });
            } else {
                if (wsClient._auth) {
                    self._reqHdlr(wsClient, msg);
                } else {
                    // [TODO] rspCode add 'unauthenticated'
                }
            }
        });
    });

    this._wsServer.on('error', function() {});
}

wsServer.prototype.sendRsp = function(wsClient, reqMsg, rspCode, rspData) {
    var rspMsg

    reqMsg._intf = 'RSP';
    reqMsg.status = rspCode;
    reqMsg.data = rspData;

    delete reqMsg.arg;

    rspMsg = JSON.stringify(reqMsg);

    wsClient.send(this._fb.encrypt(rspMsg));
}

wsServer.prototype.sendInd = function(subsys, type, data, id) {
    var self = this,
        indMsg = {
            _intf: 'IND'
            subsys: subsys,
            type: type,
            id: null,
            data: data
        };

    if (id) indMsg.id = id;

    _.forEach(self._wsClients, function (wsClient) {
        self._fb.authorize(wsClient, function (err, success) {
            if (success) {
                indMsg = JSON.stringify(indMsg);
                wsClient.send(self._fb.encrypt(indMsg));
            }
        });
    });
}

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
wsServer.prototype._reqHdlr = function (wsClient, msg) {
    var self = this;

    this._fb.authorize(wsClient, function (err, success) {
        if (success) {
            // [TODO] how to pass args to API
            self._fb[msg.subsys][msg.args](msg.args);
        } else if (err) {
            self.sendRsp(wsClient, msg, 7, err);
        } else {
            self.sendRsp(wsClient, msg, 7, new Error('Authorize failure.'));
        }
    });
}

/***********************************************************************/
/*** Event Handlers                                                  ***/
/***********************************************************************/
wsServer.prototype.onPermitJoin = function () { 
    var data = {
        netcore: null,
        leftTime: null
    }
    // [TODO]
    this.sendInd('net', 'permitJoining', data);
}

wsServer.prototype.onNetChanged = function (dev, netDelta) {
    var data = {
        address: null,
        status: null
    };
    // [TODO]
    this.sendInd('dev', 'netChanged', data, dev.id);
}

wsServer.prototype.onStatusChanged = function (dev, status) {
    this.sendInd('dev', 'statusChanged', {status: status}, dev.id);
}

wsServer.prototype.onDevIncoming = function (dev) {
    var newDev = {};

    // [TODO] device format conversion

    this.sendInd('dev', 'devIncoming', newDev, newDev.id);
}

wsServer.prototype.onDevLeaving = function (dev) {
    this.sendInd('dev', 'devLeaving', (id: dev.id), dev.id);
}

wsServer.prototype.onGadIncoming = function () {
    var newGad = {};

    // [TODO] device format conversion

    this.sendInd('gad', 'gadIncoming', newGad, newGad.id);
}

wsServer.prototype.onGadLeaving = function () {
    this.sendInd('gad', 'gadLeaving', {id: gad.id}, gad.id);
}

wsServer.prototype.onAttrReport = function (gad, attr) {
    this.sendInd('gad', 'attrReport', attr, gad.id);
}

wsServer.prototype.onDevAttrsChanged = function (dev, delta) {
    this.sendInd('dev', 'attrsChanged', delta, dev.id);
}

wsServer.prototype.onGadAttrsChanged = function (gad, delta) {
    this.sendInd('gad', 'attrsChanged', delta, gad.id);
}

module.exports = wsServer;
