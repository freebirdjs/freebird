var fb = require('freebird');
var ncZb = require('nc-zigbee');
var ncBle = require('nc-ble');
var ncMqtt = require('nc-mqtt');
var ncCoap = require('nc-coap');
/*************************************************************************************************/
/***                                                                                           ***/
/*************************************************************************************************/

// 1. nc.config()

fb.registerNetcore(ncZb);
fb.registerNetcore(ncBle);
fb.registerNetcore(ncMqtt);
fb.registerNetcore(ncCoap);

fb.start();