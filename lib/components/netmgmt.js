Freebird.prototype.start = function (callback) {
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

Freebird.prototype.stop = function (callback) {
    var self = this,
        netcores = this._netcores,
        ncNum = netcores.length,
        cbCalled = false;


};

Freebird.prototype.reset = methodGenerator2('reset');
Freebird.prototype.permitJoin = methodGenerator2('permitJoin');
Freebird.prototype.remove = methodGenerator3('remove');
Freebird.prototype.ban = methodGenerator3('ban');
Freebird.prototype.unban = methodGenerator3('unban');
Freebird.prototype.ping = methodGenerator3('ping');
Freebird.prototype.maintain = methodGenerator3('maintain'); // [TODO] Should implement in netcore


// /***********************************************************************/
// /*** Prototype Methods Generator                                     ***/
// /***********************************************************************/
// function methodGenerator2(method, args) {
//     var netcores = this._netcores,
//         numOfNcs = netcores.length,
//         method = nc[method],
//         cbCalled = false;

//     _.forEach(netcores, function (nc) {
//         try {
//             method();
//             numOfNcs -= 1;
//         } catch (e) {
//             callback(e);
//             cbCalled = true;
//         }

//         if (numOfNcs === 0 && !cbCalled)
//             callback(null, netcores.length);
//     });
// }

// function methodGenerator3(methodName) {
//     return function (ncName, permAddr, callback) {
//         var netcore = this.findByNet('netcore', ncName),
//             method;

//         if (!netcore)
//             return setImmediate(callback, new Error('netcore: ' + ncName + ' not found'));

//         method = netcore[methodName];
//         method(permAddr, callback);
//     }
// }