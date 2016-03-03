/* jslint undef: true  */
/* jslint unused: false  */

var fb = require('freebird-client');
var socket = io.connect('http://localhost:3000');
// socket.on('connect');
// socket.on('connecting');
// socket.on('disconnect');
// socket.on('connect_fail');
// socket.on('error');
// socket.on('message');
// socket.on('anything');
// socket.on('reconnect_fail');s
// socket.on('reconnect');
// socket.on('reconnecting');

fb.connect('whereServerIs');
fb.on('connect');


/*************************************************************************************************/
/*** Client Side APIs                                                                          ***/
/*************************************************************************************************/

/******************************************************/
/*** Methods                                        ***/
/******************************************************/
fb.connect();   // need authenticate at server side

fb.netcores = [ 'nc1', 'nc2', ... ];

fb.getDevices([ncName], callback);
    - fb.getNetcores(callback);
    - fb.getDevIds(ncNames, callback);
    - fb.getDevsByIds(ids, callback);

fb.getGadgets([ncName], callback);
    - (x) fb.getNetcores(callback);
    - (x) fb.getGadIds([ncNames], callback);
    - (x) fb.getGadsByIds(gadIds, callback);
    - fb.getDevGadIds(id, callback);

    fb.removeDev(id, callback);
    fb.permitJoin(mode, setting, callback);
    fb.getDevGadIds(id, callback);
    fb.getDevNetInfo(id, callback);
(v) fb.getDevInfo(id, callback);
    fb.setNwkMaintenanceConfig(schedule, ncNames, callback);
    fb.getNwkMaintenanceConfig(ncNames, callback);
    fb.resetNwk(mode, ncNames, callback);
    fb.enableNwk(ncNames, callback);
    fb.disableNwk(ncNames, callback);
    fb.identifyDev(id, callback);
    fb.setDevLocation(id, location, callback);
    fb.pingDev(id, callback);
(v) fb.getNetcores(callback);

fb.readGadRemoteAttrs(gadId, attrNames, callback);
fb.setGadAttrsReportConfig(gadId, setting, callback);
fb.getGadAttrsReportConfig(gadId, callback);

(v) fb.getDevIds(ncNames, callback);
(v) fb.getDevsByIds(ids, callback);
(v) fb.getGadIds([ncNames], callback);
(v) fb.getGadsByIds(gadIds, callback);

var dev1 = fb.findDev();   // cache
var gad1 = fb.findGad();

gad1.read();
gad1.write();
gad1.exec();

/******************************************************/
/*** Events                                         ***/
/******************************************************/
// ind:devIncoming
// ind:gadIncoming
// ind:devLeaving
// ind:gadLeaving

// ind:stateChanged
// ind:netChanged
// ind:report

// -> cmd:
// <- rsp:

