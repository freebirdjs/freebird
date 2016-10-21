# freebird

## Status: Experimental, Unstable

## Table of Contents

1. [Overview](#Overview)  
2. [Features](#Features)  
3. [Installation](#Installation)  
4. [Basic Usage](#Basic)  
5. [APIs and Events](#APIs)  
    * Basic Methods
    * Network Management
    * Device Operations
    * Gadget Operations

<a name="Overview"></a>
## 1. Overview

### TBD

<a name="Features"></a>
## 2. Overview

### TBD

<a name="Installation"></a>
## 3. Installation

### TBD

<a name="Basic"></a>
## 4. Basic Usage

### TBD

<a name="APIs"></a>
## 5. APIs and Events

### TBD


freebird._find('plugin')
freebird._find('wsApi')
freebird._find('driver')


********************************************
<a name="API_find"></a>
### .find(type, pred)
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
<a name="API_findFromNetcore"></a>
### .findFromNetcore(ncName, permAddr[, auxId])
Find a device or a gadget from the specified netcore.  
* To find a device: `findFromNetcore(ncName, permAddr)`
* To find a gadget: `findFromNetcore(ncName, permAddr, auxId)`
  
**Arguments:**  

1. `ncName` (_String_): Netcore name  
2. `permAddr` (_String_): Permanent address for the device
2. `auxId` (_String_ | _Number_): Auxiliary id for the gadget

**Returns:**  

* (_Object_): Found component, otherwise `undefined`  

**Examples:**  
  
```js
var fooDev = freebird.findFromNetcore('foo_netcore', '00:0c:29:3e:1b:d2');
var barGad = freebird.findFromNetcore('foo_netcore', '00:0c:29:3e:1b:d2', 'humidity/2');
```


********************************************
<a name="API_start"></a>
### .start()
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
### .start()
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
### .reset()
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
### .permitJoin()
Stop the freebird server.  
  
**Arguments:**  

* _none_

**Returns:**  

* (_Boolean_): `true` if enabled, otherwise `false`.  

**Examples:**  
  
```js
```

********************************************
Network Management

Namespace: net

freebird.net.start
freebird.net.stop
freebird.net.enable
freebird.net.disable
freebird.net.reset
freebird.net.permitJoin
freebird.net.remove
freebird.net.ban
freebird.net.unban
freebird.net.ping
freebird.net.maintain

********************************************
Device Operations
Namespace: dev

freebird.dev.read
freebird.dev.write
freebird.dev.identify
freebird.dev.enable
freebird.dev.disable

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