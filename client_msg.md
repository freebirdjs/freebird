Freebird Client/Server Message Formats (through websocket)
===============

<br />
## Table of Contents

1. [Overiew](#Overiew)  
2. [Interfaces](#Interfaces)  
    - [Request](#Request)  
    - [Response](#Response)  
    - [Indication](#Indication)  

3. [Indication types](#IndTypes)  
4. [Data model](#DataModel)  

<br />

<a name="Overiew"></a>  
## 1. Overview  

This document describes the APIs of how a Freebird Web Client can communicate with the Freebird Server through [websocket](http://www.websocket.org/). The APIs are based on a _**Request**_, _**Response**_, and _**Indication**_ model of messages in JSON.  
  
The requests, reponses and indications between Client and Server are classified in three different socket events. They are '_REQ', '_RSP' and '_IND', respectively.  
  
The Client-side can fire a `_REQ` event along with a message `msg` it likes to send. The Server-side has to listen the `_REQ` event to see what a Client wants.

********************************************

<br />

<a name="Interfaces"></a>  
## 2. Interfaces  

<a name="Request"></a>
### Request  

  Direction: Client sends to Server
  Event: `'_REQ'`
  Message: { _intf, subsys, seq, id, cmd, args }

| Property | Type            | Description                                                                                                               |
|----------|-----------------|---------------------------------------------------------------------------------------------------------------------------|
| _intf    | String          | A string of '_REQ'.                                                                                                       |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this message going to.                   |
| seq      | Number          | Sequence number of this REQ/RSP transaction.                                                                              |
| id       | Number          | id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`. |
| cmd      | String | Number | Command Identifier.                                                                                                       |
| args     | Array           | Command arguments.                                                                                                        |

********************************************

<a name="Response"></a>
### Response  

  Direction: Server respond to Client  
  Event: `'_RSP'`
  Message: { _intf, subsys, seq, id, cmd, status, data }

| Property | Type            | Description                                                                                                                        |
|----------|-----------------|------------------------------------------------------------------------------------------------------------------------------------|
| _intf    | String          | A string of '_RSP'.                                                                                                                |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this message coming from.                         |
| seq      | Number          | Sequence number of this REQ/RSP transaction.                                                                                       |
| id       | Number          | id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`.          |
| cmd      | String | Number | Command Identifier.                                                                                                                |
| status   | Number          | Status code.                                                                                                                       |
| data     | Depends         | Data along with the response. To learn the data format corresponding to each command, please see section [Data Model](#DataModel). |

********************************************

<a name="Indication"></a>
### Indication  

  Direction: Server indicates Client  
  Event: `'_IND'`
  Message: { _intf, type, subsys, id, data }

| Property | Type            | Description                                                                                                               |
|----------|-----------------|---------------------------------------------------------------------------------------------------------------------------|
| _intf     | String          | A string of '_IND'.                                                                                                       |
| type     | String          | There few types of indication accepted. Please see section [Indication types](#IndTypes) for details.                     |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this indication coming from.             |
| id       | Number          | id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`. |
| data     | Depends         | Data along with the indication. Please see section [Data Model](#DataModel) to learn the indicating data format.          |

********************************************

<a name="IndTypes"></a>  
## 3. Indication types  

| Type            | Description                                                                        |
|-----------------|------------------------------------------------------------------------------------|
| 'attrChanged'   | Attribue on a gadget has changed.                                                  |
| 'statusChanged' | Status of a device has changed. The status can be 'online', 'sleep', and 'online'. |
| 'netChanged'    | Network parameters of a device has been changed.                                   |
| 'attrReport'    | A report message of certain attribute on a gadget.                                 |
| 'devIncoming'   | A device is incoming.                                                              |
| 'gadIncoming'   | A gadget is incoming.                                                              |
| 'devLeaving'    | A device is leaving.                                                               |
| 'gadLeaving'    | A gadget is leaving.                                                               |
| 'permitJoing'   | Server is now opened or closed for device joining the network.                     |


<a name="DataModel"></a>  
## 4. Data Model  

<a name="DataRequest"></a>
### Command Request/Response Data Model  

(1) getIds

**Request Example**

```js
{
    subsys: 'nwk',
    seq: 18,
    id: null,
    cmd: 'getIds',
    args: {
        ncName: 'ble-core',
        type: 'dev'
    }
}
```

**Response Example**

```js
{
    subsys: 'nwk',
    seq: 18,
    id: null,
    cmd: 'getIds',
    status: 'success'
    data: [ 1, 2, 3, 7, 12, 19, 20, 21 ]
}
```

(2) getDevs

**Request Example**

```js
{
    subsys: 'nwk',
    seq: 22,
    id: null,
    cmd: 'getDevs',
    args: {
        ids: [ 2, 3 ]
    }
}
```

**Response Example**

```js
{
    subsys: 'nwk',
    seq: 22,
    id: null,
    cmd: 'getDevs',
    status: 'success'
    data: [
        {
            id: 2,
            name: 'xxx',
        },
        {
            id: 3,
            name: 'yyyy',
        }
    ]
}
```

(3) getGads

**Request Example**

```js
{
    subsys: 'nwk',
    seq: 31,
    id: null,
    cmd: 'getGads',
    args: {
        ids: [ 16 ]
    }
}
```

**Response Example**

```js
{
    subsys: 'nwk',
    seq: 31,
    id: null,
    cmd: 'getGads',
    status: 'success'
    data: [
        {
            id: 16,
            name: 'xxx',
        }
    ]
}
```

(4) getNetCores

**Request Example**

```js
{
    subsys: 'nwk',
    seq: 4,
    id: null,
    cmd: 'getNetCores',
    args: {
        ncNames: [ 'ble-core', 'zigbee-core' ]
    }
}
```

**Response Example**

```js
{
    subsys: 'nwk',
    seq: 4,
    id: null,
    cmd: 'getNetCores',
    status: 'success'
    data: [
        {
            name: 'ble-core',
            protocol: 'ble 4.2'
        {
            name: 'zigbee-core',
            protocol: 'zigbee pro 2007'
        },
    ]
}
```

(5) getBlacklist

**Request Example**

```js
{
    subsys: 'nwk',
    seq: 121,
    id: null,
    cmd: 'getBlacklist',
    args: {
        ncName: 'ble-core'
    }
}
```

**Response Example**

```js
{
    subsys: 'nwk',
    seq: 121,
    id: null,
    cmd: 'getBlacklist',
    status: 'success'
    data: [ 'xxxxx', 'xxxxx' ]
}
```
<a name="DataIndication"></a>
### Indication Data Model  

