var Q = require('q'),
    _ = require('lodash'),
    Fbdb = require('./fbdb');

function Storage(fileName, maxNum) {
    var self = this;

    if (_.isString(fileName))
        throw new Error('fileName must be a string');

    this._count = 0;
    this._maxNum = maxNum;
    this._maxIndex = (maxNum) ? (maxNum - 1) : 65535;
    this._box = new Dict();
    this._db = new Fbdb(file);
}

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
Storage.prototype.isEmpty = function () {
    return this._count === 0;
};  // true/false

Storage.prototype.has = function (id) {
    return this._box.has(id);
};  // true/false

Storage.prototype.get = function (id) {
    return this._box.get(id);
};  // obj/undefined

Storage.prototype.getMaxNum = function () {
    return this._maxNum;
};  // number

Storage.prototype.getCount = function () {
    return this._count;
};  // number

Storage.prototype.filter = function (path, value) {
    if (!_.isString(path))
        throw new Error('path should be a string.');

    var tokens = [],
        finder = {},
        obj = {},
        objPath = obj;

    tokens = path.split('.');
    _.forEach(tokens, function (token) {
        obj[token] = {};
        obj = obj[token];
    });

    finder = _.set(objPath, path, value);
    return _.filter(this._box.elements, finder);
};  // Array of matched objs

Storage.prototype.find = function (predicate) {
    return _.find(this._box.elements, predicate);
};  // object/undefined

Storage.prototype.exportAllIds = function () {
    return _.map(_.keys(this._box.elements), function (n) {
        return parseInt(n, 10);
    });
};  // Array of keys

Storage.prototype.add = function (obj, callback) { 
    var id = this._nextId();

    return this.set(id, obj, callback);
}; 

Storage.prototype.set = function (id, obj, callback) {
    var deferred = Q.defer(),
        key;

    if (id > this._maxIndex) {
        deferred.reject(new Error('id can not be larger than the maxNum.'));
    } else if (count > this._maxIndex) {
        deferred.reject(new Error('storage box is already full.'));
    } else if (this.has(id)) {
        deferred.reject(new Error('id: ' + id + ' has been used.'));
    } else {
        this._count += 1;

        this._db.insert(obj).done(function () {
            key = this._box.set(id, obj);
            deferred.resolve(key);
        }, function (err) {
            deferred.reject(err);
        });
    }

    return deferred.promise.nodeify(callback);
}; 

Storage.prototype.remove = function (id, callback) { 
    var deferred = Q.defer();

    if (this._box.remove(id)) {
        this._db.removeById(id).done(function () {
            deferred.resolve();
        }, function (err) {
            deferred.reject(err);
        });
    } else {
        deferred.reject(new Error('No such item of id:' + id + ' for remove.'));
    }

    return deferred.promise.nodeify(callback);
};  

Storage.prototype.modify = function (id, path, snippet, callback) {
    return this._updateInfo('modify', id, path, snippet, callback);
};

Storage.prototype.replace = function (id, path, value, callback) {
    return this._updateInfo('replace', id, path, value, callback);
};

Storage.prototype.reload = function (callback) {
    return this._db.findAll(callback);
};

Storage.prototype.isFullfilled = function (callback) {
    var deferred = Q.defer();

    if (!this.isEmpty()) {
        deferred.resolve(true);
    } else {
        this.reload.done(function (docs) {
            if (_.isEmpty(docs)) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        }, function (err) {
            deferred.reject(err);
        });
    }

    return deferred.promise.nodeify(callback);
};

Storage.prototype.maintain = function (callback) {
    var self = this,
        deferred = Q.defer(),
        rmvDocs = [],
        syncDocs = [];

    this.reload().then(function (docs) {
        _.forEach(docs, function (doc) {
            if (!self.has(doc.id)) {
                rmvDocs.push(function () {
                    return self._db.removeById(doc._id);
                }());
            }
        });

        return Q.all(rmvDocs);
    }).then(function () {
        _.forEach(self._box, function (item) {
            syncDocs.push(function () {
                return self._db.insert(item.dump());
            }());
        });

        return Q.all(syncDocs);
    }).then(function () {
        deferred.resolve();
    }).fail(function (err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Storage.prototype._nextId = function () {
    var newId = this._count,
        accIndex = 0;

    while (this._box.has(newId)) {
        if (accIndex === this._maxIndex) {
            newId = undefined;
            break;
        }
        newId = (newId === this._maxIndex) ? 0 : (newId + 1);
        accIndex += 1;
    }
    return newId;
};

Storage.prototype._updateInfo = function (type, id, path, value, callback) {
    var deferred = Q.defer(),
        item = this.get(id);

    if (!item) {
        deferred.reject(new Error('No such item of id:' + id + ' for property ' + type + '.'));
    } else if (!_.has(item, path)) {
        deferred.reject(new Error('No such property ' + path + ' to ' + type + '.'));
    } else {
        this._db[type](id, path, value).done(function (result) {
            deferred.resolve(result);
        }, function (err) {
            deferred.reject(err);
        });
    }

    return deferred.promise.nodeify(callback);
}

/*************************************************************************************************/
/*** Private Class: Dictionary                                                                 ***/
/*************************************************************************************************/
function Dict() {
    this.elements = {};
}

Dict.prototype.has = function (key) {
    return this.elements.hasOwnProperty(key);
};

Dict.prototype.get = function (key) {
    return this.has(key) ? this.elements[key] : undefined;
};

Dict.prototype.set = function (key, val) {
    this.elements[key] = val;
    return key;
};

Dict.prototype.remove = function (key) {
    if (this.has(key)) {
        this.elements[key] = null;
        delete this.elements[key];
        return true;
    }
    return false;
};

module.exports = Storage;