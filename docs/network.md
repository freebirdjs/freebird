# freebird network management

namespace: freebird.net

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

