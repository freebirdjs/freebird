# freebird network management

namespace: freebird.net

.enable(ncName, permAddr, auxId, callback)
.disable(ncName, permAddr, auxId, callback)
.read(ncName, permAddr, auxId, attr, callback)
.write(ncName, permAddr, auxId, attr, val, callback)
.exec(ncName, permAddr, auxId, attr, args, callback)
.setReportCfg(ncName, permAddr, auxId, attrName, cfg, callback)
.getReportCfg(ncName, permAddr, auxId, attrName, callback)
