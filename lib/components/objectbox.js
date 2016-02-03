var _ = require('lodash');

function ObjectBox(name, maxNum) {
    var count = 0,
        box = new Dict(),
        maxIndex,
        nextId;

    maxNum = maxNum || 1024;
    maxIndex = maxNum - 1;

    this.name = name;

    nextId = function () {
        var newId = count,
            accIndex = 0;

        while (box.has(newId)) {
            if (accIndex === maxIndex) {
                newId = undefined;
                break;
            }
            newId = (newId === maxIndex) ? 0 : (newId + 1);
            accIndex += 1;
        }
        return newId;
    };

    this.isEmpty = function () {
        return count === 0;
    };  // true/false

    this.has = function (id) {
        return box.has(id);
    };  // true/false

    this.get = function (id) {
        return box.get(id);
    };  // obj/undefined

    this.set = function (id, obj) {
        if (id > maxIndex || count > maxIndex)
            return;
        else if (!box.has(id))
            count += 1;

        return box.set(id, obj);
    };  // key/undefined

    this.add = function (obj) {
        var id = nextId();
        if (box.has(id))
            return;
        else
            return this.set(id, obj);
    };  // key/undefined

    this.remove = function (id) {
        if (box.remove(id)) {
            count -= 1;
            return true;
        }
        return false;
    };  // true/false

    this.getMaxNum = function () {
        return maxNum;
    };  // number

    this.getCount = function () {
        return count;
    };  // number

    this.filter = function (path, value) {
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
        return _.filter(box.elements, finder);
    };  // Array of matched objs

    this.matches = function (predicate) {
        return _.filter(box.elements, predicate);
    };  // Array of matched objects

    this.find = function (predicate) {
        return _.find(box.elements, predicate);
    };  // object/undefined

    this.exportAllIds = function () {
        return _.map(_.keys(box.elements), function (n) {
            return parseInt(n, 10);
        });
    };  // Array of keys
}

module.exports = ObjectBox;
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
