var Datastore = require('nedb'),
    Q = require('q'),
    _ = require('lodash');

function Fbdb (fileName) {
	this._db = new Datastore({ filename: filename, autoload: true });
};



module.exports = Fbdb;