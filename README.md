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
<a name="API_find"></a>
### .findById(type, id)
Find netcore, device, or gadget from freebird by identifier or predicate function. If you like to find a device or a gadget by address, using `.findFromNetcore()` is a better choice then using `.find()` with a predicate function.
  
**Arguments:**  

1. `type` (_String_): Accepts `'netcore'`, `'device'`, or 'gadget'` to find a netcore, a device, or  a gadget, respectively  
2. `pred` (_String_ | _Number_ | _Function_): `pred` can be a predicate function to do the generic matching. If you are finding a netcore by its name, then `pred` is the netcore name in string. If you are finding a device or a gadget by its id, then `pred` is the numeric identifier.  

**Returns:**  

* (_Boolean_): Found component, otherwise `undefined`  

**Examples:**  
  
```js
// find netcore by name
freebird.find('netcore', 'foo_netcore');

// find device by id
freebird.find('device', 88);

// find gadget by id
freebird.find('gadget', 120);

// find netcore by a predicate function
freebird.find('netcore', function (nc) {
    return nc.getName() === 'foo_netcore';
});

// find device by a predicate function
freebird.find('device', function (dev) {
    return dev.get('id') === 88;
});

// find gadget by a predicate function
freebird.find('gadget', function (gad) {
    return gad.get('id') === 120;
});

```

********************************************
<a name="API_findByNet"></a>
### .findByNet(type, ncName[, permAddr[, auxId]])

* To find a netcore: `findByNet('netcore', ncName)`
* To find a device: `findByNet('device', ncName, permAddr)`
* To find a gadget: `findByNet('gadget', ncName, permAddr, auxId)`
  
**Arguments:**  

1. `ncName` (_String_): Netcore name  
2. `permAddr` (_String_): Permanent address for the device
2. `auxId` (_String_ | _Number_): Auxiliary id for the gadget

**Returns:**  

* (_Object_): Found component, otherwise `undefined`  

**Examples:**  
  
```js
var fooDev = freebird.findByNet('netcore', 'foo_netcore', '00:0c:29:3e:1b:d2');
var barGad = freebird.findByNet('netcore', 'foo_netcore', '00:0c:29:3e:1b:d2', 'humidity/2');
```


********************************************
<a name="API_start"></a>
### .start([callback])
Start the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_stop"></a>
### .stop([callback])
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```
********************************************
<a name="API_reset"></a>
### .reset(mode[, callback])
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```
********************************************
<a name="API_permitJoin"></a>
### .permitJoin(duration[, callback])
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_remove"></a>
### .remove(ncName, permAddr, callback)
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_ban"></a>
### .ban(ncName, permAddr, callback)
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_unban"></a>
### .unban(ncName, permAddr, callback)
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_ping"></a>
### .ping(ncName, permAddr, callback)
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
<a name="API_maintain"></a>
### .maintain([ncName,][callback])
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```


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

********************************************
## Events

* Event: 'error'
    - data: `{}`

* Event: 'netReady'
    - data: `{ netcore: 'xxx' }`

* Event: 'permitJoin'
    - data: `{ netcore: 'xxx', timeLeft: 180 }`

* Event: 'started'
    - data: `{ netcore: 'xxx' }`

* Event: 'stopped'
    - data: `{ netcore: 'xxx' }`

* Event: 'enabled'
    - data: `{ netcore: 'xxx' }`

* Event: 'disabled'
    - data: `{ netcore: 'xxx' }`

* Event: 'netChanged'
    - data: `{ netcore: 'xxx', dev: 3, data: delta }`
    - data: `{ netcore: 'xxx', gad: 7, data: delta }`


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