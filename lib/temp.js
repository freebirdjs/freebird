// Freebird.prototype.getNetcore = function (ncName) {
//     return _.find(this._netcores, function (core) {
//         return core.getName() === ncName;
//     });
// };

// Freebird.prototype.findDev = function (pred) {
//     return this._devbox.find(pred);
// };

// Freebird.prototype.findGad = function (pred) {
//     return this._gadbox.find(pred);
// };

// Freebird.prototype.findDevById = function (id) {
//     return this._devbox.get(id);
// };

// Freebird.prototype.findGadById = function (id) {
//     return this._gadbox.get(id);
// };

// // [TODO]
// Freebird.prototype.getAllDevs = function (ncName) {
//     var nc = this._ncInstance(ncName);

//     if (ncName) {
//         return this._devbox.filter(function (dev) {
//             return dev.get('netcore') === nc;
//         });
//     } else {
//         return this._devbox.exportAllObjs();
//     }
// };

// // [TODO]
// Freebird.prototype.getAllGads = function (ncName) {
//     var nc = this._ncInstance(ncName);

//     if (ncName) {
//         return this._gadbox.filter(function (gad) {
//             return gad.getNetcore() === nc;
//         });
//     } else {
//         return this._gadbox.exportAllObjs();
//     }
// };

// // [TODO]
// Freebird.prototype.getBlacklist = function (ncName) {
//     var nc = this._ncInstance(ncName);
//     return nc ? nc.getBlacklist() : undefined;
// };
