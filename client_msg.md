Freebird Client/Server Message Formats (through websocket)
===============

<br />
## Table of Contents

1. [Overiew](#Overiew)  
2. [Interfaces](#Interfaces)  
    - [Request](#Request)  
    - [Response](#Response)  
    - [Indication](#Indication)  
3. [Data Model](#DataModel)  
    - [Request](#RequestData)  
    - [Response](#ResponseData)  
    - [Indication](#IndicationData)  
4. [Error Codes](#ErrorCodes)  

<br />

<a name="Overiew"></a>  
## 1. Overview  

This document describes the APIs of how a Freebird Web Client can communicate with the Freebird Server through [websocket](http://www.websocket.org/). The APIs are based on a _**Request**_, _**Response**_, and _**Indication**_ JSON messages. The message object (JSON) has a `__intf` field to denote which type of a message is. The value of `__intf` property can be either 'REQ', 'RSP' or 'IND'.  
  
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
| cmd      | String          | Command Identifier.                                                                                                       |
| arg      | Object          | A value-object taht contains command arguments.                                                                           |

- **Message Example**:  

```js
{ 
    __intf: 'REQ',
    subsys: 'nwk',
    seq: 3,
    id: 0,
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
    id: 0,
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

| Property | Type            | Description                                                                                                                                 |
|----------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| __intf   | String          | 'IND'                                                                                                                                       |
| subsys   | String          | Only 3 types accepted. They are 'net', 'dev', 'gad' to denote which subsystem is this indication coming from.                               |
| type     | String          | There are few types of indication accepted. Please see section [Indication types](#IndTypes) for details.                                   |
| id       | Number          | Id of the sender. id means **nothing** if `subsys === 'net'`, **device id** if `subsys === 'dev'`, and **gadget id** if `subsys === 'gad'`. |
| data     | Depends         | Data along with the indication. Please see section [Data Model](#DataModel) to learn the indicating data format.                            |

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
<a name="DataModel"></a>  
## 3. Data Model  

<a name="RequestData"></a>
### Request  

| Subsystem | Command      | Arguments (arg)          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|-----------|--------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| nwk       | getAllDevIds | { [ncName] }             | Get identifiers of all devices on freebird Server. **ncName** field is a string and is optional. If **ncName** is given, only identifiers of devices managed by that netcore will be returned from Server.                                                                                                                                                                                                                                                                                                                                                                                   |
| nwk       | getAllGadIds | { [ncName] }             | Get identifiers of all gadgets on freebird Server. **ncName** field is a string and is optional. If **ncName** is given, only identifiers of gadgets managed by that netcore will be returned from Server.                                                                                                                                                                                                                                                                                                                                                                                   |
| nwk       | getDevs      | { ids }                  | Get information of devices by their ids. **ids** is an array of numbers and each number is a device id, i.e., given `{ ids: [ 5, 6, 77 ] }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| nwk       | getGads      | { ids }                  | Get gadget information by gadget id. **ids** is an array of numbers and each number is a gadget id, i.e., given `{ ids: [ 23, 14, 132 ] }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| nwk       | getNetcores  | { ncNames }              | Get netcore information by netcore name. **ncNames** is an array of strings and each string is a netcore name, i.e., given `{ ncNames: [ 'ble-core', 'zigbee-core' ] }`.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| nwk       | getBlacklist | {}                       | Get blacklist of the banned devices. No arguments, hence the `arg` object is left empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| nwk       | permitJoin   | { ncName }               | Open or close for device to join the network.**ncName** is the name of which netcore you like to open or close for device joining. **ncName** should be a string. For example, given `{ ncName: 'zigbee-core' }` to let the zigbee network open for device joining.                                                                                                                                                                                                                                                                                                                          |
| nwk       | maintain     | { ncName }               | Maintain the network. .**ncName** is the name of which netcore you like to maintain. **ncName** should be a string. When a netcore starts to maintain its own network, all devices managed by it will be refreshed. For example, given `{ ncName: 'ble-core' }` to let the BLE netcore do its maintenance.                                                                                                                                                                                                                                                                                   |
| nwk       | reset        | { ncName }               | Reset the network. **ncName** is the name of which netcore you like to reset. **ncName** should be a string. Reset a network will remove all devices managed by that netcore. Once reset, the banned devices in the blacklist will also be removed.                                                                                                                                                                                                                                                                                                                                          |
| nwk       | enable       | { ncName }               | Enable the network. **ncName** is the name of which netcore you like to enable. (The netcore is enabled by default.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| nwk       | disable      | { ncName }               | Disable the network.**ncName** is the name of which netcore you like to disable. If netcore is disabled, no message can be send out and received from remote devices. That is, messages will be ignored and you will not get any message from the netcore on freebird Server.                                                                                                                                                                                                                                                                                                                |
| dev       | read         | { id, attrName }         | Read an attribute on a device. **id** is the id of which device you like to read from. **attrName** is the attribute you like to read. For example, given `{ id: 20, attrName: 'location' }` to read the location attribute from the device with id = 20.                                                                                                                                                                                                                                                                                                                                    |
| dev       | write        | { id, attrName, value }  | Write value to an attribute on a device.**id** is the id of which device you like to write a value to. **attrName** is the attribute to be written. For example, given `{ id: 20, attrName: 'location', value: 'kitchen' }` to set the device location attribute to 'kitchen'.                                                                                                                                                                                                                                                                                                               |
| dev       | remove       | { id }                   | Remove a device from the network. **id** is the id of which device to remove.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| dev       | identify     | { id }                   | Identify a device in the network. **id** is the id of which device to be identified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| dev       | ping         | { id }                   | Ping a device in the network. **id** is the id of which device you like to ping.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| dev       | ban          | { ncName, permAddr }     | Ban a device from the network. Once a device has been banned, freebird will remove it from the network and will always reject its joining request. **ncName** is the netcore that manages the device you'd like to ban. **permAddr** is the permanent address of  the banned device. For example, given `{ ncName: 'zigbee-core', permAddr: '0x00124b0001ce4b89' }` to ban a zigbee device with an IEEE address of 0x00124b0001ce4b89. The permanent address depends on protocol, such as IEEE address for zigbee devices, BD address for BLE devices, and MAC address for IP-based devices. |
| dev       | unban        | { ncName, permAddr }     | Unban a device. **ncName** is the netcore that manages the device to be banned. **permAddr** is the permanent address of the banned device. For example, given `{ ncName: 'zigbee-core', permAddr: '0x00124b0001ce4b89' }` to unban a zigbee device with an IEEE address of 0x00124b0001ce4b89.                                                                                                                                                                                                                                                                                              |
| gad       | read         | { id, attrName }         | Read an attribute on a gadget. **id** is the id of which gadget you like to read from.**attrName** is the attribute you like to read. For example, given `{ id: 2316, attrName: 'sensorValue' }` to read the sensed value attribute from a temperature sensor (the sensor is a gadget with id = 2316).                                                                                                                                                                                                                                                                                       |
| gad       | write        | { id, attrName, value }  | Write value to an attribute on a gadget. **id** is the id of which gadget you like to write a value to. **attrName** is the attribute to be written. For example, given `{ id: 1314, attrName: 'onOff', value: 1 }` to turn on a light bulb (the light bulb is a gadget with id = 1314).                                                                                                                                                                                                                                                                                                     |
| gad       | exec         | { id, attrName[, args] } | Invoke a remote procedure on a gadget. **id** is the id of which gadget you like to perform its particular procedure. **attrName** is the attribute name of an executable procedure. **args** is an array of parameters given in order to meet the procedure signature. The signature depends on how a developer declare his(/her) own procedure. For example, given `{ id: 9, attrName: 'blink', value: [ 10, 500 ] }` to blink a LED on a gadget 10 times with 500ms interval.                                                                                                             |
| gad       | setReportCfg | { id, attrName, cfg }    | Set the condition for an attribute reporting from a gadget.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| gad       | getReportCfg | { id, attrName }         | Get the report settings of an attribute on a gadget.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
********************************************

<a name="ResponseData"></a>
### Response  

The response message is an object with keys { __intf, subsys, seq, id, cmd, status, data }. `status` shows if the request is successful. The `data` field contains the respond data according to the request. `data` will be null if the request is unsuccessful.  

| Subsystem | Command Name | Response Data Type | Data Description                                     | Example                         |
|-----------|--------------|--------------------|------------------------------------------------------|---------------------------------|
| nwk       | getAllDevIds | Number[]           | Array of device identifiers                          | [ 1, 2, 3, 8, 12 ]              |
| nwk       | getAllGadIds | Number[]           | Array of gadget identifiers                          | [ 2, 3, 5, 11, 12, 13, 14, 15 ] |
| nwk       | getDevs      | Object[]           | Array of device information objects                  | [ devInfo, ...  ]               |
| nwk       | getGads      | Object[]           | Array of gadget information objects                  | [ gadInfo , ... ]               |
| nwk       | getNetcores  | Object[]           | Array of netcore information objects                 | [ ncInfo, ... ]                 |
| nwk       | getBlacklist | Object[]           | Array of banned device objects                       | [ bannedDev, ... ]              |
| nwk       | permitJoin   | -                  | No data returned                                     | null                            |
| nwk       | maintain     | -                  | No data returned                                     | null                            |
| nwk       | reset        | -                  | No data returned                                     | null                            |
| nwk       | enable       | -                  | No data returned                                     | null                            |
| nwk       | disable      | -                  | No data returned                                     | null                            |
| dev       | read         | Depends            | The read value. Can be anything                      | 3                               |
| dev       | write        | Depends            | The written value. Can be anything                   | 'kitchen'                       |
| dev       | remove       | String             | Device permanent address                             | '0x00124b0001ce4b89'            |
| dev       | identify     | -                  | No data returned                                     | null                            |
| dev       | ping         | Number             | Round-trip time in ms                                | 12                              |
| dev       | ban          | -                  | No data returned                                     | null                            |
| dev       | unban        | -                  | No data returned                                     | null                            |
| gad       | read         | Depends            | The read value. Can be anything                      | 371.42                          |
| gad       | write        | Depends            | The written value. Can be anything                   | false                           |
| gad       | exec         | Depends            | The data returned by the procedure. Can be anything  | 'completed'                     |
| gad       | setReportCfg | Null               | No data returned                                     | null                            |
| gad       | getReportCfg | Object             | Report settings object                               | rptCfg                          |

#### devInfo  

| Property     | Type            | Description                                                                       |
|--------------|-----------------|-----------------------------------------------------------------------------------|
| id           | Number          | Device id                                                                         |
| nc           | String          | Name of the netcore that holds this device                                        |
| enable       | Boolean         | Is this device enabled?                                                           |
| jointime     | Number          | When this device joined the network? UNIX time in secs                            |
| status       | String          | Device status, can be 'online', 'sleep', or 'offline'                             |
| name         | String          | Device name. Can be set by user                                                   |
| description  | String          | Device description. Can be set by user                                            |
| address      | Object          | { permanent: '00:0c:29:ff:ed:7c', dynamic: '192.168.1.101' }                                      |
| role         | String          | Device role. Depends on protocol, i.e., 'peripheral' for BLE devices, 'router' for zigbee devices |
| parent       | Number          | Parent device id. Default is 0 which is a number reserved for netcores.           |
| manufacturer | String          | Manufacturer name |
| model        | String          | Model name |
| serial       | Depends         | Serial number in string |
| version      | Object          | { hardware: '', software: 'v1.2.2', firmware: 'v0.0.8' } |
| power        | Depends         | Data along with the response. To learn the data format corresponding to each command, please see section [Data Model](#DataModel). |
| location     | Depends         | Data along with the response. To learn the data format corresponding to each command, please see section [Data Model](#DataModel). |
| gads         | Depends         | Data along with the response. To learn the data format corresponding to each command, please see section [Data Model](#DataModel). |


<a name="IndicationData"></a>
### Indication  

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

| Subsystem | Indication    | Data Type | Description                                                                        | Example |
|-----------|---------------|-----------|------------------------------------------------------------------------------------|---------|
| nwk       | permitJoing   |           | Server is now opened or closed for device joining network.                         |         |
| dev       | netChanged    |           | Network parameters of a device has been changed.                                   |         |
| dev       | statusChanged |           | Status of a device has changed. The status can be 'online', 'sleep', and 'online'. |         |
| dev       | devIncoming   |           | A device is incoming.                                                              |         |
| dev       | devLeaving    |           | A device is incoming.                                                              |         |
| gad       | attrChanged   |           | Attribute on a gadget or a device has changed.                                     |         |
| gad       | attrReport    |           | A report message of certain attribute on a gadget.                                 |         |
| gad       | gadIncoming   |           | A device is incoming.                                                              |         |
| gad       | gadLeaving    |           | A gadget is leaving.                                                               |         |


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

