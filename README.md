# freebird

## Status: Experimental, Unstable

## About the Logo

TBD

## Table of Contents

1. [Overview](#Overview)  
2. [Features](#Features)  
3. [Installation](#Installation)  
4. [Basic Usage](#Basic)  
5. [APIs and Events](#APIs)  
    * Basic methods
    * Network management
6. Freebird Base Classes
    * Netcore class
    * Device class
    * Gadget class
7. Advanced Topics
    * Remote process communication (RPC)
    * How to add a transport for RPC
    * How to add a plugin

<a name="Overview"></a>
## 1. Overview

### TBD

<a name="Features"></a>
## 2. Features

### TBD

<a name="Installation"></a>
## 3. Installation

> $ npm install freebird --save

<a name="Basic"></a>
## 4. Basic Usage

```js
var Freebird = require('freebird'),
    bleCore = require('freebird-netcore-ble'),
    mqttCore = require('freebird-netcore-mqtt'),
    coapCore = require('freebird-netcore-coap'),
    zigbeeCore = require('freebird-netcore-coap');

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

<a name="APIs"></a>
## 5. APIs and Events

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
var Freebird = require('freebird');

var bleNetcore = require('freebird-netcore-ble'),
    zbNetcore = require('freebird-netcore-zigbee'),
    options = {
        maxDevNum: 100,
        maxGadNum: 500
    };

var freebird = new Freebird([bleNetcore, zbNetcore], options);
```

********************************************
<a name="API_findById"></a>
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

********************************************
<a name="API_findByNet"></a>
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

********************************************
<a name="API_filter"></a>
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
********************************************
<a name="API_addTransport"></a>
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

********************************************
<a name="API_start"></a>
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

********************************************
<a name="API_stop"></a>
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
********************************************
<a name="API_reset"></a>
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
********************************************
<a name="API_permitJoin"></a>
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

********************************************
<a name="API_remove"></a>
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

********************************************
<a name="API_ban"></a>
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

********************************************
<a name="API_unban"></a>
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

********************************************
<a name="API_ping"></a>
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

********************************************
<a name="API_maintain"></a>
### .maintain([ncName,][callback])
[TODO] Stop the freebird server.  
  
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

********************************************
## Events

* Event: 'error'
    - Emitted when freebird occurs error
    - data: `error object`

* Event: 'ready'
    - Emitted when freebird is ready
    - data: `{ netcore: 'xxx' }`

* Event: 'ncEnabled'
    - Emitted when a netcore is enabled
    - data: `{ ncName: 'xxx' }`

* Event: 'ncDisabled'
    - Emitted when a netcore is disabled
    - data: `{ ncName: 'xxx' }`

* Event: 'ncStarted'
    - Emitted when a netcore is started
    - data: `{ ncName: 'xxx' }`

* Event: 'ncStopped'
    - Emitted when a netcore is stopped
    - data: `{ ncName: 'xxx' }`

* Event: 'ncPermitJoin'
    - Emitted when a netcore is now allowing or disallowing devices to join the network, where `timeLeft` is number of seconds left to allow devices to join the network. 
    - data: `{ ncName: 'xxx', timeLeft: 60 }`

* Event: 'devIncoming'
    - Emitted when a new device is incoming
    - data: `{ ncName: 'xxx', permAddr: '00:0c:29:ff:ed:7c', id: 5, device:  }`

********************************************


'netChanged',
'statusChanged',
'devPropsChanged',
'devAttrsChanged',
'panelChanged',
'gadPropsChanged',
'gadAttrsChanged',
'devIncoming',
'devLeaving',
'devReporting',
'bannedDevIncoming',
'bannedDevReporting',
'gadIncoming',
'gadLeaving',
'gadReporting',
'bannedGadIncoming',
'bannedGadReporting'

'error'
'ready'
'ncEnabled'
'ncDisabled'
'ncStarted'
'ncStopped'
'ncPermitJoin'
'devIncoming'
'devLeaving'
'devReporting'
'devNetChanged'
'devStatusChanged'
'devPropsChanged'
'devAttrsChanged'
'gadIncoming'
'gadLeaving'
'gadReporting'
'gadPanelChanged'
'gadPropsChanged'
'gadAttrsChanged'
'bannedDevIncoming'
'bannedDevReporting'
'bannedGadIncoming'
'bannedGadReporting'


********************************************
Device Operations
Namespace: dev

freebird.dev.enable
freebird.dev.disable
freebird.dev.read
freebird.dev.write
freebird.dev.identify

********************************************
Device Operations
Namespace: gad

freebird.gad.enable
freebird.gad.disable
freebird.gad.read
freebird.gad.write
freebird.gad.exec
freebird.gad.setReportCfg
freebird.gad.getReportCfg