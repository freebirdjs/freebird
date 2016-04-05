var EventEmitter = require('events'),
    _ = require('lodash'),
    nmx = require('./subsystems/netmux'),
    fab = require('./subsystems/fabricator'),
    io = require('socket.io'),
    moment = require('moment'),
    CoatError = require('./utils/coatError');

var fb = {};

function Freebird() {

}

util.inherits(Freebird, EventEmitter);
module.exports = Freebird;

Freebird.prototype.registerNetcore = function (core) {

};

/***********************************************************************/
/*** simen's part: pseudo code here                                  ***/
/*** Put all Device and Gadget work from netcore to freebird         ***/
/***********************************************************************/
fb.on('_nc:error', function (msg) {
    // {
    //    netcore: Object,
    //    error: Error
    // }
    _ncErrorHdlr(msg);
});

fb.on('_nc:enabled', function (msg) {
    // { netcore: Object }
    _ncEnabledHdlr(msg);
});

fb.on('_nc:disabled', function (msg) {
    // { netcore: Object }
    _ncDisabledHdlr(msg);
});

fb.on('_nc:devIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    raw: device raw data
    // }
    _ncDevIncomingHdlr(msg);
});

fb.on('_nc:devLeaving', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    // }
    _ncDevLeavingHdlr(msg);
});

fb.on('_nc:gadIncoming', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    raw: gad raw data
    // }
    _ncGadIncomingHdlr(msg);
});

fb.on('_nc:devAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    attrs: Object
    // }
    _ncDevAttrsReportHdlr(msg);
});

fb.on('_nc:gadAttrsReport', function (msg) {
    // {
    //    netcore: Object,
    //    permAddr: address,
    //    auxId: aux id,
    //    attrs: Object
    // }
    _ncGadAttrsReportHdlr(msg);
});