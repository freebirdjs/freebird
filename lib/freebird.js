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