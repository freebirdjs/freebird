var _ = require('buysman');

function Agent(freebird) {
    this._servers = [];
    this._freebird = freebird;
}

Agent.prototype.createChannel = function (server) {
    if (_.includes(this._servers, server))
        return;

    this._servers.push(server);
    
    server.on('message', function (msg) {
        var params = self.parse(msg);

        if (!params) {

        } else {
            var api = self._freebird._apis[params];
            api.apply(self._freebird, args, function (err, data) {
                server.send(data);
            });
        }
    });
};

Agent.prototype.parse = function (msg) {

    return {
        api: 'xxxx',
        args: []
    };
};

