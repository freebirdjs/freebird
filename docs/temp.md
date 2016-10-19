
## freebird
.find(type, pred)
.findFromNetcore(ncName, type, permAddr, auxId)

.start(callback)
.stop(callback)

.register(type, obj, callback)
.unregister(type, obj, callback)

._fireup(evt, fbMsg, wsMsg)
._getWsServer()
._fire(evt, fbMsg, wsMsg)

freebird.net.enable()
...
freebird.dev.read();
...
freebird.gad.read();


# driver

.bindDrivers(freebird)

.enable(ncName, callback)
.disable(ncName, callback)
.start(ncName, callback)
.stop(ncName, callback)
.reset(ncName, mode, callback)
.permitJoin(ncName, duration, callback)
.remove(ncName, permAddr, callback)
.ban(ncName, permAddr, callback)
.unban(ncName, permAddr, callback)
.ping(ncName, permAddr, callback)
.maintain(ncName, permAddr, callback)

.devEnable(ncName, permAddr, callback)
.devDisable(ncName, permAddr, callback)
.devRead(ncName, permAddr, attr, callback)
.devWrite(ncName, permAddr, attr, val, callback)
.devIdentify(ncName, permAddr, callback)

.gadEnable(ncName, permAddr, auxId, callback)
.gadDisable(ncName, permAddr, auxId, callback)
.gadRead(ncName, permAddr, auxId, attr, callback)
.gadWrite(ncName, permAddr, auxId, attr, val, callback)
.gadExec(ncName, permAddr, auxId, attr, args, callback)
.gadSetReportCfg(ncName, permAddr, auxId, attrName, cfg, callback)
.gadGetReportCfg(ncName, permAddr, auxId, attrName, callback)

# netcore listeners

ncError
(v) ncPermitJoin
(v) ncStarted
(v) ncStopped
(v) ncEnabled
(v) ncDisabled

(v) ncReady
(v) ncDevNetChanging
(v) ncDevIncoming
(v) ncDevLeaving
(v) ncGadIncoming
ncGadLeaving
ncDevReporting
ncGadReporting
ncBannedDevIncoming
ncBannedDevReporting
ncBannedGadIncoming
ncBannedGadReporting

devError
devNetChanged
devPropsChanged
devAttrsChanged
gadPanelChanged
gadPropsChanged
gadAttrsChanged
gadAttrsAppend

Private:
bannedComponent
getBanndedEventName
updateComponent
updatePropsComponent
getUpdateEventName