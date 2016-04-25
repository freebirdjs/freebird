var Datastore = require('nedb'),
    Q = require('q'),
    _ = require('lodash');

function Fbdb (fileName) {
    if (!_.isString(fileName))
        throw new Error('fileName must be a string.');

    this._db = new Datastore({ filename: fileName, autoload: true });

    this._db.ensureIndex({ fieldName: 'id', unique: true }, function (err) {});
}

Fbdb.prototype.insert = function (doc, callback) {
    var self = this,
        deferred = Q.defer();

    this.findById(doc.id).then(function (result) {
        if (!result) {
            self._db.insert(doc, function (err, newDoc) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(newDoc);
                }
            });
        } else {
            self._db.update({ id: result.id }, { $set: doc }, { multi: true }, function (err, numReplaced) {
                self.findById(doc.id).done(function (updatedDoc) {
                    deferred.resolve(updatedDoc);
                }, function (err) {
                    deferred.reject(err);
                });
            });
        }
    });

    return deferred.promise.nodeify(callback);
};

Fbdb.prototype.removeById = function (id, callback) {
    var deferred = Q.defer();

    this._db.remove({ id: id }, { multi: true }, function (err, numRemoved) {
        if (err)
            deferred.reject(err);
        else 
            deferred.resolve(numRemoved);
    });

    return deferred.promise.nodeify(callback);
};

Fbdb.prototype.findById = function (id, callback) {
    var deferred = Q.defer();

    this._db.findOne({ id: id }, function (err, doc) {
        if (err)
            deferred.reject(err);
        else 
            deferred.resolve(doc);
    });

    return deferred.promise.nodeify(callback);
};

Fbdb.prototype.modify = function (id, path, snippet, callback) {
    var self = this,
        deferred = Q.defer(),
        pLength = path.length + 1,
        diffSnippet = {},
        invalidPath = [],
        objToModify = {};

    if (path === 'id' || _.has(snippet, 'id')) {
        deferred.reject(new Error('id can not be modified.'));
    } else {
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
                    self._db.update({ id: id }, { $set: objToModify }, { multi: true }, function (err, numReplaced) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            self.findById(id).done(function (newItem) {
                                _.forEach(objToModify, function (val, checkPath) {
                                    var subPath = checkPath.substr(pLength),
                                        newVal = _.get(newItem, checkPath),
                                        oldVal = _.get(item, checkPath);

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
    }

    return deferred.promise.nodeify(callback);
};

Fbdb.prototype.replace = function (id, path, value, callback) {
    var self = this,
        deferred = Q.defer(),
        objToReplace = {};

    if (path === 'id') {
        deferred.reject(new Error('id can not be replaced.'));
    } else {
        objToReplace[path] = value;

        this.findById(id).then(function (item) {
            if (!item) {
                deferred.reject(new Error('No such object ' + id + ' for property replacing.'));
            } else if (!_.has(item, path)) {
                deferred.reject(new Error('No such property ' + path + ' to replace.'));
            } else {
                self._db.update({ id: id }, { $set: objToReplace }, { multi: true }, function (err, numReplaced) {
                    if (err)
                        deferred.reject(err);
                    else 
                        deferred.resolve(numReplaced);
                });
            }
        }).fail(function (err) {
            deferred.reject(err);
        }).done();
    }

    return deferred.promise.nodeify(callback);
};

Fbdb.prototype.findAll = function (callback) {
    var deferred = Q.defer(),
        cursor = this._db.find({ id: {$exists: true} });

    cursor.sort({ id: 1 }).exec(function (err, docs) {
        if (err)
            deferred.reject(err);
        else
            deferred.resolve(docs);
    });

    return deferred.promise.nodeify(callback);
};

function buildPathValuePair (path, obj) {
    var result = {};

    _.forEach(obj, function (val, key) {
        if (_.isObject(val))
            result = _.merge(result, buildPathValuePair(path + '.' + key, val));
        else 
            result[path + '.' + key] = val;
    });

    return result;
}

module.exports = Fbdb;