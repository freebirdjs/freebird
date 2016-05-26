var util = require('util');
var _ = require('lodash');
var http = require('http');
var ncMock = require('freebird-netcore-mockup');
var expect = require('chai').expect,
    assert = require('chai').assert;

var FreebirdBase = require('freebird-base'),
    Device = FreebirdBase.Device,
    Gadget = FreebirdBase.Gadget,
    Netcore = FreebirdBase.Netcore;

var Freebird = require('../index');

var httpServer = http.createServer();

// console.log(ncMock);
httpServer.listen(3000);

var fbird = new Freebird(httpServer);
fbird.registerNetcore(ncMock, function (err, nc) {
    if (err)
        console.log('err');
    else
        console.log('nc');
});

