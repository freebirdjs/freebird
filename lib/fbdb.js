var Datastore = require('nedb'),
    Q = require('q'),
    _ = require('lodash');

function Fbdb (fileName) {
    if (!_.isString(fileName))
        throw new Error('fileName must be a string.');

    this._db = new Datastore({ filename: fileName, autoload: true });
};

Fbdb.prototype.insert = function (doc, callback) {
    var deferred = Q.defer();

    this._db.insert(doc, function (err, newDoc) {
        if (err)
            deferred.reject(err);
        else
            deferred.resolve(newDoc);
    });

    this.findById(doc.id).then(function () {
        if (!result) {
            this._db.insert(doc, function (err, newDoc) {
                if (err)
                    deferred.reject(err);
                else
                    deferred.resolve(newDoc);
            });
        } else {
            this._db.update(result._id, { $set: doc }, { multi: true }, function (err, numReplaced) {
                if (err)
                    deferred.reject(err);
                else
                    deferred.resolve(result);
            });
        }
    })

    return deferred.promise.nodeify(callback);
}

Fbdb.prototype.removeById = function (id, callback) {
    var deferred = Q.defer();

    this._db.remove({ _id: id }, { multi: true }, function (err, numRemoved) {
        if (err)
            deferred.reject(err);
        else 
            deferred.resolve(numRemoved);
    });

    return deferred.promise.nodeify(callback);
}

Fbdb.prototype.findById = function (id, callback) {
    var deferred = Q.defer();

    this._db.findOne({ _id: id }, function (err, doc) {
        if (err)
            deferred.reject(err);
        else 
            deferred.resolve(doc);
    });

    return deferred.promise.nodeify(callback);
}

Fbdb.prototype.modify = function (id, path, snippet, callback) {
    var self = this,
        deferred = Q.defer(),
        pLength = path.length + 1,
        diffSnippet = {},
        invalidPath = [],
        objToModify = {};

    if (_.isObject(snippet)) 
        objToModify = buildPathValuePair(path, snippet);
    else 
        objToModify[path] = snippet;
    
    this.findById(id).then(function (item) {
        if (!item) {
            deferred.reject(new Error('No such object ' + id + ' for property modifying.'));
        } else {
            _.forEach(objToModify, function (val, key) {
                if (!_.has(item, key))
                    invalidPath.push(key);
            });

            if (_.size(invalidPath) !== 0) {
                deferred.reject(new Error('No such property ' + invalidPath[0] + ' to modify.'));
            } else {
                self._db.update({ _id: id }, { $set: objToModify }, { multi: true }, function (err, numReplaced) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        self.findById(id).done(function (newItem) {
                            _.forEach(objToModify, function (val, checkPath) {
                                var subPath = checkPath.substr(pLength),
                                    newVal = _.get(newSo, checkPath),
                                    oldVal = _.get(so, checkPath);

                                subPath = (subPath === '') ? checkPath : subPath;
                                if ( newVal !== oldVal)
                                    _.set(diffSnippet, subPath, newVal);
                            });

                            deferred.resolve(diffSnippet);
                        }, function(err) {
                            deferred.reject(err);
                        });
                        
                    }
                });
            }
        }
    }).fail(function () {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
}

Fbdb.prototype.replace = function (id, path, value, callback) {
    var self = this,
        deferred = Q.defer(),
        objToReplace = {};

    objToReplace[path] = value;

    this.findById(id).then(function (item) {
        if (!item) {
            deferred.reject(new Error('No such object ' + id + ' for property replacing.'));
        } else if (!_.has(item, path)) {
            deferred.reject(new Error('No such property ' + path + ' to replace.'));
        } else {
            self._db.update({ _id: id }, { $set: objToReplace }, { multi: true }, function (err, numReplaced) {
                if (err)
                    deferred.reject(err);
                else 
                    deferred.resolve(numReplaced);
            });
        }
    }).fail(function (err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
}

Fbdb.prototype.findAll = function (callback) {
    var deferred = Q.defer(),
        cursor = this._db.find({ _id: {$exists: true} });

    cursor.sort({ _id: 1 }).exec(function (err, docs) {
        if (err)
            deferred.reject(err);
        else
            deferred.resolve(docs);
    });

    return deferred.promise.nodeify(callback);
}

function buildPathValuePair (path, obj) {
    var result = {};

    _.forEach(obj, function (val, key) {
        if (_.isObject(value))
            result = _.merge(result, buildPathValuePair(path + '.' + key, val));
        else 
            result[key] = val;
    });

    return result;
}

module.exports = Fbdb;