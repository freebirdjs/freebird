var _ = require('lodash'),
    should = require('should'),
    fs = require('fs'),
    DataStore = require('nedb'),
    Fbdb = require('../lib/fbdb');

var fbdb,
	dbPath = '../lib/database/fb.db';

fs.exists(dbPath, function (isThere) {
    if (isThere) { fs.unlink(dbPath); }
});

var nc1 = {
        id: 1,
        name: 'nc1',
        enabled: false,
        protocol: 'zigbee',
        startTime: 0,
        defaultJoinTime: 180,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 0, bytes: 0 }
        }
    },
    nc2 = {
        id: 2,
        name: 'nc2',
        enabled: true,
        protocol: 'bluetooth',
        startTime: 19200,
        defaultJoinTime: 30,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 3, bytes: 20 }
        }
    },
    nc3 = {
        id: 3,
        name: 'nc3',
        enabled: true,
        protocol: 'mqtt',
        startTime: 25000,
        defaultJoinTime: 60,
        traffic: {
            in: { hits: 5, bytes: 60 },
            out: { hits: 10, bytes: 300 }
        }
    },
    nc4 = {
        id: 4,
        name: 'nc4',
        enabled: false,
        protocol: 'coap',
        startTime: 600,
        defaultJoinTime: 90,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 0, bytes: 0 }
        }
    }

describe('Constructor Check', function () {
	it('new Fbdb()', function () {
		fbdb = new Fbdb('/home/hedy/freebird/freebird/lib/database/fb.db');
        (fbdb._db).should.instanceof(DataStore);
	});
});

describe('Insert Check', function () {
    it('insert nc1', function (done) {
        fbdb.insert(nc1).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc1, doc)) done();
        });
    });

    it('insert nc2', function (done) {
        fbdb.insert(nc2).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc2, doc)) done();
        });
    });

    it('insert nc3', function (done) {
        fbdb.insert(nc3).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc3, doc)) done();
        });
    });

    it('insert nc1 again', function (done) {
        nc1.defaultJoinTime = 60;
        fbdb.insert(nc1).then(function (doc) {
            delete doc._id;
            if (_.isEqual(doc, nc1)) done();
        });
    });

    it('insert nc2 again', function (done) {
        nc2.defaultJoinTime = 90;
        fbdb.insert(nc2).then(function (doc) {
            delete doc._id;
            if (_.isEqual(doc, nc2)) done();
        });
    });

    it('insert nc3 again', function (done) {
        nc3.defaultJoinTime = 30;
        fbdb.insert(nc3).then(function (doc) {
            delete doc._id;
            if (_.isEqual(doc, nc3)) done();
        });
    });
});

describe('Find By Id Check', function () {
    it('find nc1', function (done) {
        fbdb.findById(nc1.id).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc1, doc)) done();
        });
    });

    it('find nc2', function (done) {
        fbdb.findById(nc2.id).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc2, doc)) done();
        });
    });

    it('find nc3', function (done) {
        fbdb.findById(nc3.id).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc3, doc)) done();
        });
    });

    it('find nc4', function (done) {
        fbdb.findById(nc4.id, function (err, doc) {
            if (!doc) done();
        });
    });

    it('insert nc4', function (done) {
        fbdb.insert(nc4).then(function (doc) {
            delete doc._id;
            if (_.isEqual(doc, nc4)) done();
        });
    });

    it('find nc4', function (done) {
        fbdb.findById(nc4.id).then(function (doc) {
            delete doc._id;
            if (_.isEqual(nc4, doc)) done();
        });
    });
});
// nc1 = {
//         id: 1,
//         name: 'nc1',
//         enabled: false,
//         protocol: 'zigbee',
//         startTime: 0,
//         defaultJoinTime: 180,
//         traffic: {
//             in: { hits: 0, bytes: 0 },
//             out: { hits: 0, bytes: 0 }
//         }
//     },
describe('Modify Check', function () {
    it('modify id', function (done) {
        fbdb.modify(1, 'id', 5).fail(function (err) {
            if (err) done();
        });
    });

    it('modify id', function (done) {
        fbdb.modify(1, 'id', { x: 10 }).fail(function (err) {
            if (err) done();
        });
    });

    it('modify()', function (done) {
        fbdb.modify(1, 'protocol', 'zigbeee').then(function (diff) {
            if (_.isEqual(diff, { protocol: 'zigbeee' })) done();
        });
    });
    
});

describe('Replace Check', function () {

});

describe('Find All Check', function () {

});

describe('Remove By Id Check', function () {

});