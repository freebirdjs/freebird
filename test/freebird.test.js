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


fbird.on('error', function (err) {
    console.log(err);
});

fbird.on('devIncoming', function (data) {
    console.log('>>>>>>>> devIncoming');
    // console.log(err);
    console.log(data.dev._gads);
});

fbird.on('gadIncoming', function (data) {
    console.log('>>>>>>>> gadIncoming');
    // console.log(err);
    console.log(data.gad.getDev()._gads);
});


// fbird.on('devIncoming', function (data) {
//     console.log('>>>>>>>> devIncoming');
//     // console.log(err);
//     console.log(data.dev);
// });


fbird.on('_nc:devIncoming', function (data) {
    console.log('_nc:devIncoming');
    // console.log(err);
    //console.log(data);
});

fbird.start(function (err) {
    console.log('start');
    fbird.net.permitJoin('mock', 180);
    // console.log(ncMock._fb);
});