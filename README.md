# freebird

[![NPM](https://nodei.co/npm/freebird.png?downloads=true)](https://nodei.co/npm/freebird/)  

[![Travis branch](https://img.shields.io/travis/freebirdjs/freebird/master.svg?maxAge=2592000)](https://travis-ci.org/freebirdjs/freebird)
[![npm](https://img.shields.io/npm/v/freebird.svg?maxAge=2592000)](https://www.npmjs.com/package/freebird)
[![npm](https://img.shields.io/npm/l/freebird.svg?maxAge=2592000)](https://www.npmjs.com/package/freebird)

<br />

## Status: Experimental, Unstable

## About the Logo

TBD

## Table of Contents

1. [Overview](#Overview)  
2. [Features](#Features)  
3. [Installation](#Installation)  
4. [Basic Usage](#Basic)  
5. [APIs and Events](#APIs)  
    * [Basic methods](#basicApis)  
    * [Network management](#nwkMgmtApis)  
6. [Freebird Base Classes](#FbBase)  
    * [Netcore class](#Netcore)  
    * [Device class](#Device)  
    * [Gadget class](#Gadget)  
7. [Advanced Topics](#Advanced)  
    * [Remote process communication (RPC)](#RPC)  
    * [How to add a transport for RPC](#addTransp)  
    * [How to add a plugin](#addPlugin)  
8. [Appendix](#Appendix)  
    * [Device Data Format](#devDataFormat)
    * [Gadget Data Format](#gadDataFormat)

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

<a name="APIs"></a>
## 5. APIs and Events  

<a name="basicApis"></a>
### Basic methods  

* [new Freebird()](#API_Freebird)
* [.findById()](#API_findById)
* [.findByNet()](#API_findByNet)
* [.filter()](#API_filter)
* [.addTransport()](#API_addTransport)


<a name="nwkMgmtApis"></a>
### Network management  

* [.start()](#API_start)
* [.stop()](#API_stop)
* [.reset()](#API_reset)
* [.permitJoin()](#API_permitJoin)
* [.remove()](#API_remove)
* [.ban()](#API_ban)
* [.unban()](#API_unban)
* [.ping()](#API_ping)
* [.maintain()](#API_maintain)

</br>

********************************************
<a name="API_Freebird"></a>
### new Freebird(netcores[, options])
Create a instance of the `Freebird` class. This document will use `freebird` to denote the instance.

**Arguments:**  

1. `netcores` (_Object_ | _Array_): Should be a netcore or an array of netcores.
2. `options` (_Object_): Optional settings for freebird.

| Property  | Type   | Mandatory | Description                                                                                                                                                         |
|-----------|--------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| maxDevNum | Number | optional  | Capacity of the device box of freebird, which is the maximum number of devices that freebird can store. If not given, a default value 200 will be used.             |
| maxGadNum | Number | optional  | Capacity of the gadget box of freebird, which is the maximum number of gadgets that freebird can store. If not given, a default value 600 will be used.             |
| dbPath    | Object | optional  | This object has fileds of `device` and `gadget` which is used to specify the file path to tell freebird where you'd like to keep your device or gadget information. |

**Returns:**  

* (_Object_): freebird

**Examples:**

```js
var Freebird = require('freebird'),
    bleCore = require('freebird-netcore-ble'),
    mqttCore = require('freebird-netcore-mqtt'),
    coapCore = require('freebird-netcore-coap'),
    zigbeeCore = require('freebird-netcore-zigbee');

var options = {
        maxDevNum: 100,
        maxGadNum: 500
    };

var freebird = new Freebird([bleCore, mqttCore, coapCore, zigbeeCore], options);
```

<a name="API_findById"></a>
</br>
********************************************
### .findById(type, id)
Find a netcore by name, or find a device/gadget by id. If you like to find a device/gadget by address, using `.findByNet()`.  
  
**Arguments:**  

1. `type` (_String_): Only accepts `'netcore'`, `'device'`, or `'gadget'` to find a netcore, a device, or  a gadget, respectively.  
2. `id` (_String_ | _Number_): `id` is the netcore name when finding for a netcore. `id` is a number when finding for a device or a gadget.  

**Returns:**  

* (_Object_): Found component, otherwise `undefined`  

**Examples:**  
  
```js
// find netcore by name
freebird.findById('netcore', 'foo_netcore');        // netcore instance
freebird.findById('netcore', 'no_such_netcore');    // undefined (netcore not found)

// find device by id
freebird.findById('device', 88);    // device instance
freebird.findById('device', 999);   // undefined (device not found)

// find gadget by id
freebird.findById('gadget', 120);   // gadget instance
freebird.findById('gadget', 777);   // undefined (gadget not found)
```

<a name="API_findByNet"></a>
</br>
********************************************
### .findByNet(type, ncName[, permAddr[, auxId]])
Find a netcore, a device, or a gadget by network information.  

* To find a netcore: `findByNet('netcore', ncName)`
* To find a device: `findByNet('device', ncName, permAddr)`
* To find a gadget: `findByNet('gadget', ncName, permAddr, auxId)`
  
**Arguments:**  

1. `type` (_String_): Only accepts `'netcore'`, `'device'`, or `'gadget'` to find a netcore, a device, or  a gadget, respectively.  
2. `ncName` (_String_): Netcore name.  
3. `permAddr` (_String_): Permanent address of the device which is required when finding for a device or a gadget.  
4. `auxId` (_String_ | _Number_): Auxiliary id of the gadget which is required when finding for a gadget.  

**Returns:**  

* (_Object_): Found component, otherwise `undefined`  

**Examples:**  
  
```js
// find netcore by name
freebird.findByNet('netcore', 'foo_netcore');       // netcore instance
freebird.findByNet('netcore', 'no_such_netcore');   // undefined (netcore not found)

// find device by its network info
freebird.findByNet('device', 'foo_netcore', '00:0c:29:3e:1b:d2');       // device instance
freebird.findByNet('device', 'no_such_netcore', '00:0c:29:3e:1b:d2');   // undefined (not found)
freebird.findByNet('device', 'foo_netcore', '00:00:00:00:00:00');       // undefined (not found)

// find gadget by its network info
freebird.findByNet('gadget', 'foo_netcore', '00:0c:29:3e:1b:d2', 'humidity/2');     // gadget instance
freebird.findByNet('gadget', 'no_such_netcore', '00:0c:29:3e:1b:d2', 'humidity/2'); // undefined (not found)
freebird.findByNet('gadget', 'foo_netcore', '00:00:00:00:00:00', 'humidity/2');     // undefined (not found)
freebird.findByNet('gadget', 'foo_netcore', '00:0c:29:3e:1b:d2', 'no_such_auxId');  // undefined (not found)
```

<a name="API_filter"></a>
</br>
********************************************
### .filter(type, pred)
This method returns an array of netcores, devices, or gadgets which contains all elements of `pred` returns truthy for.  
  
**Arguments:**  

1. `type` (_String_): Only accepts `'netcore'`, `'device'`, or `'gadget'` to find netcores, devices, or gadgets that meet the prediction, respectively.  
2. `pred` (_Function_): `function (obj) {}`,  the function invoked per iteration in a netcores, devices, or gadget collection.  

**Returns:**  

* (_Array_): Returns the new filtered array of components  

**Examples:**  

```js
// filter for netcores
freebird.filter('netcore', function (nc) {
    return nc.isEnabled();
});

// filter for devices
freebird.filter('device', function (dev) {
    return dev.isEnabled();
});

// filter for gadgets
freebird.filter('gadget', function (gad) {
    return gad.isEnabled();
});
```

<a name="API_addTransport"></a>
</br>
********************************************
### .addTransport(name, transp[, callback])
Add a transportation to freebird for RPC messaging. Please refer to [freebird-transport](https://github.com/freebirdjs/freebird-transport) module for more details.  
  
**Arguments:**  

1. `name` (_String_): Transportation name.
2. `transp` (_Object_): The instance of transportation.  
3. `callback` (_Function_): `function (err) {}`.  

**Returns:**  

* none

**Examples:**  
  
```js
var http = require('http'),
    fbRpc = require('freebird-rpc');

var httpServer = http.createServer().listen(3000),
    rpcServer = fbRpc.createServer(httpServer);

freebird.addTransport('rpcTransp', rpcServer, function (err) {
    if (err)
        console.log(err);
});
```

<a name="API_start"></a>
</br>
********************************************
### .start([callback])
Start the freebird server.  
  
**Arguments:**  

1. `callback` (_Function_): `function (err) {}`. Get called after started.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.start(function (err) {
    if (!err)
        console.log('freebird is up');
    else
        console.log(err);
});
```

<a name="API_stop"></a>
</br>
********************************************
### .stop([callback])
Stop the freebird server.  
  
**Arguments:**  

1. `callback` (_Function_): `function (err) {}`. Get called after stopped.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
nc.stop(function (err) {
    if (!err)
        console.log('freebird is down');
    else
        console.log(err);
});
```

<a name="API_reset"></a>
</br>
********************************************
### .reset(mode[, callback])
Reset the freebird server.  
  
**Arguments:**  

1. `mode` (_Number_): `0` for a soft reset and `1` for a hard reset.  
2. `callback` (_Function_): `function (err) {}`. Get called after reset is applied. When freebird restarted, `'ready'` event will be fired.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.on('ready', function () {
    console.log('freebird is ready');
});

freebird.reset(0, function (err) {
    if (!err)
        console.log('freebird starts to run its reset procedure');
    else
        console.log(err);
});
```

<a name="API_permitJoin"></a>
</br>
********************************************
### .permitJoin(duration[, callback])
Let the freebird allow devices to join the network.  
  
**Arguments:**  

1. `duration` (_Number_): Duration in seconds for allowing devices to join the network. Set it to `0` can immediately close the admission.  
2. `callback` (_Function_): `function (err, timeLeft) {}`. Get called when freebird starts/stops to permit joining, where `timeLeft` is a number that indicates time left for device joining in seconds, e.g., 180.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.permitJoin(180, function (err, timeLeft) {
    if (!err)
        console.log(timeLeft);  // 180
});

freebird.permitJoin(0, function (err, timeLeft) {
    if (!err)
        console.log(timeLeft);  // 0
});
```

<a name="API_remove"></a>
</br>
********************************************
### .remove(ncName, permAddr, callback)
Remove a remote device from the network.  

**Arguments:**  

1. `ncName` (_String_): Netcore name.  
2. `permAddr` (_String_): Permanent address of the device to remove.  
3. `callback` (_Function_): `function (err, permAddr) {}`. Get called after device removed, where `permAddr` is permananet address of that device.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.remove('mqtt-core', '00:0c:29:ff:ed:7c', function (err, permAddr) {
    if (!err)
        console.log(permAddr);  // 00:0c:29:ff:ed:7c
});
```

<a name="API_ban"></a>
</br>
********************************************
### .ban(ncName, permAddr, callback)
Ban a device from the network. Once a device is banned, it can never join the network unless you unban it.
  
**Arguments:**  

1. `ncName` (_String_): Netcore name.  
2. `permAddr` (_String_): Permanent address of the device to ban.  
3. `callback` (_Function_): `function (err, permAddr) {}`. Get called after device banned, where `permAddr` is permananet address of that device.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.ban('mqtt-core', '00:0c:29:ff:ed:7c', function (err, permAddr) {
    if (!err)
        console.log(permAddr);  // 00:0c:29:ff:ed:7c
});
```

<a name="API_unban"></a>
</br>
********************************************
### .unban(ncName, permAddr, callback)
Unban a device.  
  
**Arguments:**  

1. `ncName` (_String_): Netcore name.  
2. `permAddr` (_String_): Permanent address of the device to unban.  
3. `callback` (_Function_): `function (err, permAddr) {}`. Get called after device unbanned, where `permAddr` is permananet address of that device.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.unban('mqtt-core', '00:0c:29:ff:ed:7c', function (err, permAddr) {
    if (!err)
        console.log(permAddr);  // 00:0c:29:ff:ed:7c
});
```

<a name="API_ping"></a>
</br>
********************************************
### .ping(ncName, permAddr, callback)
Ping a remote device.  

**Arguments:**  

1. `ncName` (_String_): Netcore name.  
2. `permAddr` (_String_): Permanent address of the device to ping.  
3. `callback` (_Function_): `function (err, time) {}`. Get called after ping response comes back, where `time` is the round-trip time in milliseconds, e.g., 16.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.ping('mqtt-core', '00:0c:29:ff:ed:7c', function (err, time) {
    if (!err)
        console.log(time);  // 42
});
```

<a name="API_maintain"></a>
</br>
********************************************
### .maintain([ncName,][callback])
Maintain the freebird server. This will refresh all devices information by rediscovering the remote device.
  
**Arguments:**  

1. `ncName` (_String_): Netcore name. freebird will maintain all netcores if `ncName` not given.
2. `callback` (_Function_): `function (err) {}`. Get called after maintained.  

**Returns:**  

* _none_  

**Examples:**  
  
```js
freebird.maintain('mqtt-core', function (err) {
    if (!err)
        console.log('freebird is maintained');
});
```

</br>
********************************************

## Events

Event Listener: `function (msg) { ... }`

* Event: 'error'
    - Emitted when freebird occurs error
    - msg: `error object`

* Event: 'ready'
    - Emitted when freebird is ready
    - msg: `{ netcore: 'mqtt-core' }`

* Event: 'ncEnabled'
    - Emitted when a netcore is enabled
    - msg: `{ ncName: 'mqtt-core' }`

* Event: 'ncDisabled'
    - Emitted when a netcore is disabled
    - msg: `{ ncName: 'mqtt-core' }`

* Event: 'ncStarted'
    - Emitted when a netcore is started
    - msg: `{ ncName: 'mqtt-core' }`

* Event: 'ncStopped'
    - Emitted when a netcore is stopped
    - msg: `{ ncName: 'mqtt-core' }`

* Event: 'ncPermitJoin'
    - Emitted when a netcore is now allowing or disallowing devices to join the network, where `timeLeft` is number of seconds left to allow devices to join the network. 
    - msg: `{ ncName: 'mqtt-core', timeLeft: 60 }`

* Event: 'devIncoming'
    - Emitted when a new device is incoming
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, device: device }`

* Event: 'devLeaving'
    - Emitted when a device is leaving
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5 }`

* Event: 'devReporting'
    - Emitted when a report message of certain attribute(s) on a device is coming. `data` property is partial changes of [devAttrsObj](#devAttrsObj)
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, data: devAttrs }`

* Event: 'devNetChanged'
    - Emitted when network information of a device has changed. `data` property is partial changes of [netInfoObj](#netInfoObj), _data property is the old [netInfoObj](#netInfoObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, data: netInfoObj, _data: oldValue }`

* Event: 'devStatusChanged'
    - Emitted when status of a device has changed. The status can be 'online', 'sleep', 'offline', and 'unknown'.
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, data: 'offline' }`

* Event: 'devPropsChanged'
    - Emitted when meta-property(ies) of a device has changed. `data` property is partial changes of [devPropsObj](#netInfoObj), _data property is the old [devPropsObj](#netInfoObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, data: delta, _data: oldValue }`

* Event: 'devAttrsChanged'
    - Emitted when attribute(s) on a device has changed. `data` property is partial changes of [devAttrsObj](#devAttrsObj), _data property is the old [devAttrsObj](#devAttrsObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', id: 5, data: delta, _data: oldValue }`

* Event: 'gadIncoming'
    - Emitted when a new gadget is incoming
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5, gadget: gadget }`

* Event: 'gadLeaving'
    - Emitted when a gadget is leaving
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5 }`

* Event: 'gadReporting'
    - Emitted when a report message of certain attribute(s) on a gadget is coming. `data` property is partial changes of [gadAttrsObj](#gadAttrsObj)
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5, data: delta }`

* Event: 'gadPanelChanged'
    - Emitted when panel information of a gadget has changed. `data` property is partial changes of [panelInfoObj](#panelInfoObj), _data property is the old [panelInfoObj](#panelInfoObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5, data: delta, _delta: oldVal }`

* Event: 'gadPropsChanged'
    - Emitted when meta-property(ies) of a gadget has changed. `data` property is partial changes of [gadPropsObj](#gadPropsObj), _data property is the old [gadPropsObj](#gadPropsObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5, data: delta, _delta: oldVal }`

* Event: 'gadAttrsChanged'
    - Emitted when attribue(s) on a gadget has changed. `data` property is partial changes of [gadAttrsObj](#gadAttrsObj), _data property is the old [gadAttrsObj](#gadAttrsObj) value that before changed 
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0', id: 5, data: delta }`

* Event: 'bannedDevIncoming'
    - Emitted when a banned device is trying to join the network
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c' }`

* Event: 'bannedDevReporting'
    - Emitted when a banned device is trying to report its attributes
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c' }`

* Event: 'bannedGadIncoming'  
    - Emitted when a banned gadget is trying to join the network  
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0' }`  

* Event: 'bannedGadReporting'  
    - Emitted when a banned gadget is trying to report its attributes
    - msg: `{ ncName: 'mqtt-core', permAddr: '00:0c:29:ff:ed:7c', auxId: 'magnetometer/0' }`

</br>

<a name="FbBase"></a>
## 6. Freebird Base Classes  

[freebird-base](https://github.com/freebirdjs/freebird-base) includes base classes of Netcore, Device, and Gadget that are used in the freebird IoT network and application framework. These classes are abstractions of the network controller, network device, and real appliance, respectively.  

<a name="Netcore"></a>
### Netcore Class  

Netcore is a network controller which equips with freebird-defined methods to accomplish operations of network transportation and management. In pratice, the netcore may be a zigbee coordinator (TI CC253X), a BLE central (TI CC254X).  

APIs `findById()`, `findByNet()`, `filter()` can help you find the instance of this class. The instance which is denoted as `netcore` in this document. Please see [NetcoreClass.md](https://github.com/freebirdjs/freebird-base/blob/master/docs/NetcoreClass.md) for more detail about this class.

<a name="Device"></a>
### Device Class

Device is a wired/wireless machine in the network. For example, a zigbee end-device, a BLE peripheral, a MQTT client, or a CoAP server(LWM2M client).

APIs `findById()`, `findByNet()`, `filter()` can help you find the instance of this class. The instance which is denoted as `device` in this document. Please see [DeviceClass.md](https://github.com/freebirdjs/freebird-base/blob/master/docs/DeviceClass.md) for more detail about this class.

<a name="Gadget"></a>
### Gadget Class

Gadget represents something specific and functional in our life. For example, a temperature sensor, a light switch, or a barometer.

APIs `findById()`, `findByNet()`, `filter()` can help you find the instance of this class. The instance which is denoted as `gadget` in this document. Please see [GadgetClass.md](https://github.com/freebirdjs/freebird-base/blob/master/docs/GadgetClass.md) for more detail about this class.

</br>

<a name="Advanced"></a>
## 7. Advanced Topics  

<a name="RPC"></a>
### Remote Process Communication (RPC)  

**freebird** is a underlying construction that helps you manage your machine network of different protocol in the same time, like BLE, Zigbee, MQTT or CoAP. With **freebird**, it is easy and quick to implement IoT webapps.

In the process of establishing webapp, due to the communcation between the web client and the web server is remotely, so you need to build a RPC channel to do Remote Process Communication. There are many ways to implement RPC channel, you can use TCP socket, RESTful APIs, WebSocket, etc. And Developers should define RPC interface according to their application type. 

</br>

<a name="addTransp"></a>
### How to add a transport for RPC  

There is a module [freebird-transport](https://github.com/freebirdjs/freebird-transport) for developers to create their own transportation for RPC, please see the [document](https://github.com/freebirdjs/freebird-transport) of how to create the transportation to communicate with freebird framework. After the transportation is created, you can call `freebird.addTransport()` to add the transportation to freebird for RPC messaging. 

Here is a example of how to create a transportation and add to freebird: 

```js
var Freebird = require('freebird'),
    bleCore = require('freebird-netcore-ble'),
    mqttCore = require('freebird-netcore-mqtt');

var net = require('net'),
    Transport = require('freebird-transport');

var freebird = new Freebird([ bleCore, mqttCore ]);

var transp = new Transport(),
    server,
    client;

// Implement a transportation using TCP protocol
server = net.createServer(function (c) {
    client = c;

    client.on('end', function () {
        client = null;
    });

    // Message received
    client.on('data', function (data) {
        transp.receive({ data: data });
    });
});

server.listen(4321, function () {
    console.log('TCP server starts');
});

// Implementaion of _send
transp._send = function (msg, callback) {
    var bytes;

    if (typeof msg !== 'object')
        return setImmediate(callback, new TypeError('msg should be an object'));

    if (typeof msg.data === 'string')
        msg.data = new Buffer(msg.data);

    if (!Buffer.isBuffer(msg.data))
        return setImmediate(callback, new TypeError('msg.data should be a string or a buffer'));

    bytes = msg.data.length;

    if (!client)
        return setImmediate(callback, new Error('No client connected'));

    client.write(msg.data);
    setImmediate(callback, null, bytes);
};

// Add the transportation to freebird framework
freebird.addTransport('tcpRpsServer', transp);
```

We have already implemented a transportation [freebird-rpc](https://github.com/freebirdjs/freebird-rpc) using WebSocket protocol. It provide methods to create RPC client and RPC server for real-time remote communication. The following is a simple example of how to using `freebird-rpc` in freebird:

```js
var Freebird = require('freebird'),
    bleCore = require('freebird-netcore-ble'),
    mqttCore = require('freebird-netcore-mqtt'),
    http = require('http'),
    fbRPC = require('freebird-rpc');

var freebird = new Freebird([ bleCore, mqttCore ]);

var httpServer = http.createServer();
httpServer.listen(3000);

var transp = fbRpc.createServer(httpServer);

freebird.addTransport('wsRpsServer', transp);
```

</br>

<a name="addPlugin"></a>
### How to add a plugin  

[TODO]

</br>

<a name="Appendix"></a>
## 8. Appendix

<a name="devDataFormat"></a>
### Device Data Format

<a name="netInfoObj"></a>
#### Network information: `netInfoObj`

| Property    | Type    | Description                                                                                                  |  
|-------------|---------|--------------------------------------------------------------------------------------------------------------|  
| enabled     | Boolean | Tells if this device is enabled.                                                                             |  
| joinTime    | Number  | Device joined time, which is an UNIX(POSIX) time in ms.                                                      |  
| timestamp   | Number  | Timestamp at the last activity.                                                                              |  
| traffic     | Object  | The traffic record of this device.                                                                           |  
| role        | String  | Device role, which depends on protocol. For example, it may be `'peripheral'` of a BLE device.               |  
| parent      | String  | The parent of this device. It is `'0'` if the parent is the netcore, otherwise parent's permanent address.   |  
| maySleep    | Boolean | Tells whether this device may sleep or not.                                                                  |  
| sleepPeriod | Number  | The sleep period in seconds. This property is only valid when maySleep is `true`.                            |  
| status      | String  | Can be `'unknown'`, `'online'`, `'offline'`, or `'sleep'`.                                                   |  
| address     | Object  | The permanent and dynamic adrresses of this device. This object is in the shape of `{ permanent, dynamic }`. |  

<a name="devAttrsObj"></a>
#### Attributes on the **remote** device: `devAttrsObj`

| Property     | Type            | Description                                                                                                                           |
|--------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------|
| manufacturer | String          | Manufacturer name                                                                                                                     |
| model        | String          | Model name                                                                                                                            |
| serial       | String          | Serial number of this device.                                                                                                         |
| version      | Object          | Version tags. This object is in the shape of `{ hw: '', sw: 'v1.2.2', fw: 'v0.0.8' }`                                                 |
| power        | Object          | Power source. This object is in the shape of `{ type: 'battery', voltage: '5 V' }`. The type can be 'line', 'battery' or 'harvester'. |

<a name="devPropsObj"></a>
#### User-defined properties on this device: `devPropsObj`

| Property    | Type      | Description                                                                                                |  
|-------------|-----------|------------------------------------------------------------------------------------------------------------|  
| name        | String    | Human-redable name of this device, default will be an empty string `''` if not set.                        |  
| description | String    | Device description. Default will be an empty string `''` if not set.                                       |  
| location    | String    | Location of this device. Default will be an empty string `''`  if not set.                                 |  
| _Others_    | _Depends_ | Other props                                                                                                |  


<a name="gadDataFormat"></a>
### Gadget Data Format

<a name="panelInfoObj"></a>
#### Panel information: `panelInfoObj`
* (_Object_): Panel information about this gadget.  

| Property  | Type    |  Description                                                       |
|-----------|---------|--------------------------------------------------------------------|
| enabled   | Boolean | Indicate whether this gadget is enabled                            |
| profile   | String  | Profile of this gadget, can be any string, such as 'Home'          |
| classId   | String  | Gadget class to tell what kind of an application is on this gadget |

<a name="gadAttrsObj"></a>
#### Attributes on the **remote** gadget: `gadAttrsObj`

| Property    | Type      | Description                                                                                                                                                                       |  
|-------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|  
| _Others_    | _Depends_ | Remote attributes depend on classId of gadget. For a temperature sensor, it will have an attribute `sensorValue`, and may have attributes like `units` and `resetMinMaxMeaValues`. The possilbe attributes are listed [here](https://github.com/PeterEB/smartobject/blob/master/docs/templates.md). |  

<a name="gadPropsObj"></a>
#### User-defined properties on this gadget: `gadPropsObj`

| Property    | Type      | Description                                                                                                |  
|-------------|-----------|------------------------------------------------------------------------------------------------------------|  
| name        | String    | Human-redable name of this gadget, default will be a string of `'unknown'` if not set                      |  
| description | String    | Gadget description. Default will be an empty string `''` if not set                                        |  
| _Others_    | _Depends_ | Other props                                                                                                |  
