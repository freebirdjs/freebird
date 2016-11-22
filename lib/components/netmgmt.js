var loader = require('./loader.js');

var netMgmt = {};

netMgmt.start = function (callback) {
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;

    // reload all devices and gadgets from database
    loader.reload(this, function (err) {
        if (err) {
            process.nextTick(function () {
                self.emit('error', err);
            });
            cbCalled = true;
            callback(err);
        } else {
            netcores.forEach(function (nc) {    // start all netcores
                nc.start(function (er) {
                    ncNum -= 1;
                    if (er && !cbCalled) {
                        self.emit('error', er);
                        callback();
                    }

                    else if (ncNum === 0 && !cbCalled)
                        callback();
                });
            });
        }
    });
};

netMgmt.stop = function (callback) {
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;


};

netMgmt.reset = function (ncName, callback) {

};

netMgmt.permitJoin = function (ncName, callback) {

};

netMgmt.maintain = function (ncName, callback) {
    var nc = this._findByNet('netcore', ncName);

    if (!nc)
        return setImmediate(callback, new Error('netcore not found'));

    return nc.maintain(callback);
};

netMgmt.remove = function (ncName, permAddr, callback) {

};

netMgmt.ban = function (ncName, permAddr, callback) {

};

netMgmt.unban = function (ncName, permAddr, callback) {

};

netMgmt.ping = function (ncName, permAddr, callback) {

};