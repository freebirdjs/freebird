Freebird Client/Server Message Formats (through websocket)
===============

<br />
## Table of Contents

1. [Overiew](#Overiew)  
2. [Interfaces](#Interfaces)  
    - [Request](#Request)  
    - [Response](#Response)  
    - [Indication](#Indication)  
3. [Request Data Model](#RequestData)  
4. [Response Data Model](#ResponseData)  
5. [Indication Data Model](#IndicationData)  
6. [Error Codes](#ErrorCodes)  

<br />

<a name="Overiew"></a>  
## 1. Overview  

This document describes the APIs of how a Freebird Web Client can communicate with the Freebird Server through [websocket](http://www.websocket.org/). The APIs are based on a _**Request**_, _**Response**_, and _**Indication**_ message model with JSON. The message object (JSON) has a `__intf` field to denote which type of a message is. The value of `__intf` property can be either 'REQ', 'RSP' or 'IND'.  
  
********************************************

<br />

<a name="Interfaces"></a>  
## 2. Interfaces  

<a name="Request"></a>
### Request  

- **Direction**:  
    Client sends to Server  
- **Interface**:  
    __intf = 'REQ'  
- **Message**:  
    { __intf, subsys, seq, id, cmd, arg }  

| Property | Type            | Description                                                                                                               |
|----------|-----------------|---------------------------------------------------------------------------------------------------------------------------|
| __intf   | String          | 'REQ'                                                                                                                     |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this message going to.                   |
| seq      | Number          | Sequence number of this REQ/RSP transaction.                                                                              |
| id       | Number          | Id of the sender. id means **nothing** if (subsys === 'net'), **device id** if (subsys === 'dev'), and **gadget id** if (subsys === 'gad'). It is noticed that id = 0 is reserved for the freebird web-client and server. |
| cmd      | String | Number | Command Identifier.                                                                                                       |
| arg      | Array           | A value-object taht contains command arguments.                                                                           |

- **Message Example**:  

```js
{ 
    __intf: 'REQ',
    subsys: 'nwk',
    seq: 3,
    id: 0,                  // sender of this request is freebird web-client
    cmd: 'getDevs',
    arg: {
        ids: [ 2, 4, 18, 61 ]
    }
}
```
********************************************

<a name="Response"></a>
### Response  

- **Direction**:  
    Server respond to Client  
- **Interface**:  
    __intf = 'RSP'  
- **Message**:  
    { __intf, subsys, seq, id, cmd, status, data }  

| Property | Type            | Description                                                                                                                        |
|----------|-----------------|------------------------------------------------------------------------------------------------------------------------------------|
| __intf   | String          | 'RSP'                                                                                                                              |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this message coming from.                         |
| seq      | Number          | Sequence number of this REQ/RSP transaction.                                                                                       |
| id       | Number          | Id of the sender. id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`. It is noticed that id = 0 is reserved for the freebird web-client and server.  |
| cmd      | String          | Command Identifier.                                                                                                                |
| status   | Number          | Status code.                                                                                                                       |
| data     | Depends         | Data along with the response. To learn the data format corresponding to each command, please see section [Data Model](#DataModel). |

- **Message Example**:  

```js
{ 
    __intf: 'RSP',
    subsys: 'nwk',
    seq: 17,
    id: 0,                  // sender of this response is freebird server
    cmd: 'getAllDevIds',
    status: 0,
    data: [ 2, 4, 18, 61 ]
}
```
********************************************

<a name="Indication"></a>
### Indication  

- **Direction**:  
    Server indicates Client  
- **Interface**:  
    __intf = 'IND'  
- **Message**:  
    { __intf, subsys, type, id, data }  

| Property | Type            | Description                                                                                                               |
|----------|-----------------|---------------------------------------------------------------------------------------------------------------------------|
| __intf   | String          | 'IND'                                                                                                                     |
| type     | String          | There few types of indication accepted. Please see section [Indication types](#IndTypes) for details.                     |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this indication coming from.             |
| id       | Number          | Id of the sender. id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`. |
| data     | Depends         | Data along with the indication. Please see section [Data Model](#DataModel) to learn the indicating data format.          |

- **Indication types**:  

| Indication Type | Description                                                                        |
|-----------------|------------------------------------------------------------------------------------|
| 'attrChanged'   | Attribue on a gadget or a device has changed.                                      |
| 'statusChanged' | Status of a device has changed. The status can be 'online', 'sleep', and 'online'. |
| 'netChanged'    | Network parameters of a device has been changed.                                   |
| 'attrReport'    | A report message of certain attribute on a gadget.                                 |
| 'devIncoming'   | A device is incoming.                                                              |
| 'gadIncoming'   | A gadget is incoming.                                                              |
| 'devLeaving'    | A device is leaving.                                                               |
| 'gadLeaving'    | A gadget is leaving.                                                               |
| 'permitJoing'   | Server is now opened or closed for device joining network.                         |

- **Message Example**:  

```js
{ 
    __intf: 'IND',
    subsys: 'gad',
    type: 'attrChanged',
    id: 147,            // sender of this indication is a gadget with id = 147
    data: {
        sensorValue: 24
    }
}
```
********************************************
<a name="RequestData"></a>  
## 3. Request Data Model  

| Subsystem | Command Name | Arguments (`arg` object) | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|-----------|--------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| nwk       | getAllDevIds | { [ncName] }             | Get identifiers of all devices on freebird Server. **ncName** is a string and is optional. If **ncName** is given, only identifiers of devices managed by that netcore will be returned from Server.                                                                                                                                                                                                                                                                                                                                                                                 |
| nwk       | getAllGadIds | { [ncName] }             | Get identifiers of all gadgets on freebird Server. **ncName** is a string and is optional. If **ncName** is given, only identifiers of gadgets managed by that netcore will be returned from Server.                                                                                                                                                                                                                                                                                                                                                                                 |
| nwk       | getDevs      | { ids }                  | Get information of devices by their ids. **ids** is an array of numbers and each number is a device id, i.e., given `{ ids: [ 5, 6, 77 ] }`.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| nwk       | getGads      | { ids }                  | Get gadget information by gadget id. **ids** is an array of numbers and each number is a gadget id, i.e., given `{ ids: [ 23, 14, 132 ] }`.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| nwk       | getNetcores  | { ncNames }              | Get netcore information by netcore name. **ncNames** is an array of strings and each string is a netcore name, i.e., given `{ ncNames: [ 'ble-core', 'zigbee-core' ] }`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| nwk       | getBlacklist | {}                       | Get blacklist of the banned devices. No arguments, hence the `args` object is left empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| nwk       | permitJoin   | { ncName }               | Open or close for device to join the network.**ncName** is the name of which netcore you like to open or close for device joining. **ncName** should be a string. For example, given `{ ncName: 'zigbee-core' }` let the zigbee network open for device joining.                                                                                                                                                                                                                                                                                                                     |
| nwk       | maintain     | { ncName }               | Maintain the network. .**ncName** is the name of which netcore you like to maintain. **ncName** should be a string. When a netcore starts to maintain its own network, all devices managed by it will be refreshed. For example, given `{ ncName: 'ble-core' }` let the BLE netcore do its maintenance.                                                                                                                                                                                                                                                                              |
| nwk       | reset        | { ncName }               | Reset the network. **ncName** is the name of which netcore you like to reset. **ncName** should be a string. Reset a network will remove all devices managed by that netcore. Once reset, the banned devices in the blacklist will also be removed.                                                                                                                                                                                                                                                                                                                                  |
| nwk       | enable       | { ncName }               | Enable the network. **ncName** is the name of which netcore you like to enable. (The netcore is enabled by default.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| nwk       | disable      | { ncName }               | Disable the network.**ncName** is the name of which netcore you like to disable. If netcore is disabled, no message can be send out and received from remote devices. That is, messages will be ignored and you will not get any message from the netcore.                                                                                                                                                                                                                                                                                                                           |
| dev       | read         | { id, attrName }         | Read an attribute on a device. **id** is the id of which device you like to read from. **attrName** is the attribute you like to read. For example, given `{ id: 20, attrName: 'location' }` to read the location attribute from the device with id = 20.                                                                                                                                                                                                                                                                                                                            |
| dev       | write        | { id, attrName, value }  | Write value to an attribute on a device.**id** is the id of which device you like to write a value to. **attrName** is the attribute to be written. For example, given `{ id: 20, attrName: 'location', value: 'kitchen' }` to set the device location attribute to 'kitchen'.                                                                                                                                                                                                                                                                                                       |
| dev       | remove       | { id }                   | Remove a device from the network. **id** is the id of which device to remove.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| dev       | identify     | { id }                   | Identify a device in the network. **id** is the id of which device to be identified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| dev       | ping         | { id }                   | Ping a device in the network. **id** is the id of which device you like to ping.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| dev       | ban          | { ncName, permAddr }     | Ban a device from the network. Once a device has been banned, freebird will remove it from the network and will always reject its joining request. **permAddr** is the permanent address of which device you like to ban. **ncName** is the netcore that manages the device. For example, given `{ ncName: 'zigbee-core', permAddr: '0x00124b0001ce4b89' }` to ban a zigbee device with an IEEE address of 0x00124b0001ce4b89. The permanent address depends on protocol, such as IEEE address for zigbee devices, BD address for BLE devices, and MAC address for IP-based devices. |
| dev       | unban        | { ncName, permAddr }     | Unban adevice.**permAddr** is the permanent address of which device you like to unban. **ncName** is the netcore that manages the device.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| gad       | read         | { id, attrName }         | Read an attribute on a gadget. **id** is the id of which gadget you like to read from.**attrName** is the attribute you like to read. For example, given `{ id: 2316, attrName: 'sensorValue' }` to read the sensed value attribute from a temperature sensor (the sensor is a gadget with id = 2316).                                                                                                                                                                                                                                                                               |
| gad       | write        | { id, attrName, value }  | Write value to an attribute on a gadget. **id** is the id of which gadget you like to write a value to. **attrName** is the attribute to be written. For example, given `{ id: 1314, attrName: 'onOff', value: 1 }` to turn on a light bulb (the light bulb is a gadget with id = 1314).                                                                                                                                                                                                                                                                                             |
| gad       | exec         | { id, attrName[, args] } | Invoke a remote procedure on a gadget. **id** is the id of which gadget you like to perform some kind of its procedure. **attrName** is the attribute name of an executable procedure. **args** is an array of parameters and the parameters should be given in order to meet the procedure signature declaration. For example, given `{ id: 9, attrName: 'blink', value: [ 10, 500 ] }` to blink a LED on a gadget 10 times with 500ms interval.                                                                                                                                    |
| gad       | setReportCfg | { id, attrName, cfg }    | Set the condition for an attribute reporting from a gadget.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| gad       | getReportCfg | { id, attrName }         | Get the report settings of an attribute on a gadget.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
********************************************
<a name="ResponseData"></a>  
## 4. Response Data Model  

The response message is an object with keys { __intf, subsys, seq, id, cmd, status, data }. The data field contains the
respond data according to the request.  

| Subsystem | Command Name | Response Data Type | Data Description                                     | Example                         |
|-----------|--------------|--------------------|------------------------------------------------------|---------------------------------|
| nwk       | getAllDevIds | Number[]           | Array of device identifiers                          | [ 1, 2, 3, 8, 12 ]              |
| nwk       | getAllGadIds | Number[]           | Array of gadget identifiers                          | [ 2, 3, 5, 11, 12, 13, 14, 15 ] |
| nwk       | getDevs      | Object[]           | Array of device information objects                  | [ devInfo, ...  ]               |
| nwk       | getGads      | Object[]           | Array of gadget information objects                  | [ gadInfo , ... ]               |
| nwk       | getNetcores  | Object[]           | Array of netcore information objects                 | [ ncInfo, ... ]                 |
| nwk       | getBlacklist | Object[]           | Array of bannde device objects                       | [ bannedDev, ... ]              |
| nwk       | permitJoin   | -                  | No data returned                                     | null                            |
| nwk       | maintain     | -                  | No data returned                                     | null                            |
| nwk       | reset        | -                  | No data returned                                     | null                            |
| nwk       | enable       | -                  | No data returned                                     | null                            |
| nwk       | disable      | -                  | No data returned                                     | null                            |
| dev       | read         | Depends            | The read value. Can be anything                      | 3                               |
| dev       | write        | Depends            | The written value. Can be anything                   | 'kitchen'                       |
| dev       | remove       | String             | Device permanent address                             | '0x00124b0001ce4b89'            |
| dev       | identify     | -                  | No data returned                                     | null                            |
| dev       | ping         | Number             | Round-trip time in ms                                | 24                              |
| dev       | ban          | -                  | No data returned                                     | null                            |
| dev       | unban        | -                  | No data returned                                     | null                            |
| gad       | read         | Depends            | The read value. Can be anything                      | 1012.41                         |
| gad       | write        | Depends            | The written value. Can be anything                   | flase                           |
| gad       | exec         | Depends            | The data returned by the procedure. Can be anything. | 'completed'                     |
| gad       | setReportCfg | Null               | No data returned                                     | null                            |
| gad       | getReportCfg | Object             | Report settings object                               | rptCfg                          |


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
    arg: {
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

<a name="ErrorCode"></a>
### Error Code  

