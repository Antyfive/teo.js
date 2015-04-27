/*!
 * Db spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/27/15
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var Db = require("../" + teoBase + "/db/teo.db");

describe("Testing Db Client", function() {

    "use strict";

    var loadOrmStub, createOrmStub, db;

    beforeEach(function() {

        loadOrmStub = sinon.stub(Db.prototype, "_loadOrm", function() {});
        createOrmStub = sinon.stub(Db.prototype, "_createOrm", function() {});
        db = new Db({
            enabled: true,
            ormName: "waterline",
            adapterName: "teo.db.adapter.waterline",
            adapterConfig: {
                adapters: {
                    "default": "sails-disk",
                    disk: "sails-disk",
                    mysql: "sails-mysql"
                },
                connections: {
                    myLocalDisk: {
                        adapter: "disk"
                    },
                    myLocalMySql: {
                        adapter: "mysql",
                        host: "localhost",
                        database: "foobar"
                    }
                }
            }
        });

    });

    afterEach(function() {

        loadOrmStub.restore();
        createOrmStub.restore();

    });

    it("Should call load ORM", function() {

        assert.isTrue(loadOrmStub.calledOnce, "Load ORM method should be called");

    });

    it("Should call load ORM", function() {

        assert.isTrue(createOrmStub.calledOnce, "Create ORM method should be called");

    });

    it("Should not call load ORM", function() {

        loadOrmStub.reset();

        db.initialize({
            enabled: false,
            ormName: "waterline",
            adapterName: "teo.db.adapter.waterline",
            adapterConfig: {}
        });

        assert.isFalse(loadOrmStub.calledOnce, "Load ORM method should not be called");

    });

    it("Should not call load ORM", function() {

        createOrmStub.reset();

        db.initialize({
            enabled: false,
            ormName: "waterline",
            adapterName: "teo.db.adapter.waterline",
            adapterConfig: {}
        });

        assert.isFalse(createOrmStub.calledOnce, "Create ORM method should not be called");

    });

    it("Should parse config correctly", function() {

        assert.equal(db.ormPath, "./orm", "ORM path is not correct");
        assert.equal(db.ormPrefix, "teo.db.orm.", "ORM prefix is not correct");
        assert.equal(db.adapterName, "teo.db.adapter.waterline", "ORM adapter name is not correct");
        assert.deepEqual(db.adapterConfig, {
            adapters: {
                "default": "sails-disk",
                disk: "sails-disk",
                mysql: "sails-mysql"
            },
            connections: {
                myLocalDisk: {
                    adapter: "disk"
                },
                myLocalMySql: {
                    adapter: "mysql",
                    host: "localhost",
                    database: "foobar"
                }
            }
        }, "ORM adapter config is not correct");

    });

    it("Should load ORM", function() {

        loadOrmStub.restore();

        db._loadOrm();

        assert.isFunction(db.waterline, "Should be a function");

    });

    it("Should create ORM instance", function() {

        loadOrmStub.restore();
        createOrmStub.restore();

        db._loadOrm();
        db._createOrm();

        assert.instanceOf(db.orm, db.waterline, "Created ORM should be an instance of Waterline ORM");

    });

});