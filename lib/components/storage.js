var _ = require('lodash'),
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

    this.set(id, obj, function (err, key) {
        if (err)
            callback(err);
        else
            callback(null, key);
    });
}; 

Storage.prototype.set = function (id, obj, callback) {
    var key;

    if (id > this._maxIndex) {
        callback(new Error('id can not be larger than the maxNum.'));
    } else if (count > this._maxIndex) {
        callback(new Error('storage box is already full.'));
    } else if (this.has(id)) {
        callback(new Error('id: ' + id + ' has been used.'));
    } else {
        this._count += 1;

        this._db.insert(obj).done(function () {
            key = this._box.set(id, obj);
            callback(null, key);
        }, function (err) {
            callback(err);
        });
    }
}; 

Storage.prototype.remove = function (id, callback) { 
    if (this._box.remove(id)) {
        this._db.removeById(id).done(function () {
            callback(null)
        }, function (err) {
            callback(err);
        });
    } else {
        callback(new Error('No such item of id:' + id + ' for remove.'));
    }
};  

Storage.prototype.modify = function (id, path, snippet, callback) {
    var item = this.get(id);

    if (!item) {
        callback(new Error('No such item of id:' + id + ' for property replace.'));
    } else if (!_.has(item, path)) {
        callback(new Error('No such property ' + path + ' to replace.'));
    } else {
        this._db.modify(id, path, snippet, callback);
    }
};

Storage.prototype.replace = function (id, path, value, callback) {
    var item = this.get(id);

    if (!item) {
        callback(new Error('No such item of id:' + id + ' for property replace.'));
    } else if (!_.has(item, path)) {
        callback(new Error('No such property ' + path + ' to replace.'));
    } else {
        this._db.replace(id, path, value, callback);
    }
};

Storage.prototype.reload = function (callback) {
    var self = this;

    if (this.isEmpty()) {
        this._db.findAll().done(function (docs) {
            _.forEach(docs, function (doc) {
                self._count += 1;
                self._box().set(doc._id, doc);
            });
            callback(null);
        }, function (err) {
            callback(err);
        });
    }
}

/***********************************************************************/
/*** Public Methods                                                  ***/
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