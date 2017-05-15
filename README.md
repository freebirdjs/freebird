<img src="https://raw.githubusercontent.com/freebirdjs/documents/master/media/freebird_logo.png" align="right" height="96" width="96" />
  
# freebird

[![NPM](https://nodei.co/npm/freebird.png?downloads=true)](https://nodei.co/npm/freebird/)  

[![Travis branch](https://img.shields.io/travis/freebirdjs/freebird/master.svg?maxAge=2592000)](https://travis-ci.org/freebirdjs/freebird)
[![npm](https://img.shields.io/npm/v/freebird.svg?maxAge=2592000)](https://www.npmjs.com/package/freebird)
[![npm](https://img.shields.io/npm/l/freebird.svg?maxAge=2592000)](https://www.npmjs.com/package/freebird)

<br />

## Status: Experimental, Unstable


<br />

<a name="Overview"></a>
## 1. Overview

**freebird** is a Node.js framework that can building a heterogeneous network, such as BLE, ZigBee, CoAP and MQTT Protocols. It easy to deploy in many platforms like PC, Raspberry Pi, Beaglebone or other embedded device. This framework also provides a uniform interface for developers to operate the various protocols device at the same time, and as the Infrastructure of the IoT/WoT. With **freebird**, you can make **Front-end**, **Cloud** and **Machine** that simply connected with each other.  

The **freebird** framework has three basic classes of [**Netcore**](https://github.com/freebirdjs/freebird-base/blob/master/docs/NetcoreClass.md), [**Device**](https://github.com/freebirdjs/freebird-base/blob/master/docs/DeviceClass.md) and [**Gadget**](https://github.com/freebirdjs/freebird-base/blob/master/docs/GadgetClass.md) that are represent the network controller, remote device and resource of the device, respectively. For the RPC interface, you can create your own transportation to communicate with freebird, like TCP socket, RESTful APIs, WebSocket, and so on.  

<br />

<a name="Features"></a>
## 2. Features

* Cross protocol, such as BLE, ZigBee, CoAP and MQTT.
* Hierarchical data model in [Smart Object (IPSO)](http://www.ipso-alliance.org/ipso-community/resources/smart-objects-interoperability/) .
* The local network management center and application gateway.
* Based-on node.js that can easy to integrate machine applications with other services or frameworks, e.g., http server, express, React.js, Angular.js.
* Handle the most basic part of internet of things and help front-end developers build any fascinating GUI and dashboard.

<br />

<a name="Installation"></a>
## 3. Installation

> $ npm install freebird --save

<br />

<a name="Basic"></a>
## 4. Basic Usage

```js
var Freebird = require('freebird'),
    bleCore = require('freebird-netcore-ble'),
    mqttCore = require('freebird-netcore-mqtt'),
    coapCore = require('freebird-netcore-coap'),
    zigbeeCore = require('freebird-netcore-zigbee');

var freebird = new Freebird([ bleCore, mqttCore, coapCore, zigbeeCore ]);

freebird.start(function (err) {
    console.log('Server started');
});

freebird.on('ready', function () {
    
});

freebird.on('devIncoming', function (dev) {
    
});

freebird.on('gadIncoming', function (gad) {
    
});
```

<br />

