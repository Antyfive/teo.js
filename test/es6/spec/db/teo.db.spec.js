/*!
 * Teo DB spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/15/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const Db = require(`../${teoBase}/db/teo.db`);

describe("Testing Teo DB", () => {

    let loadOrmStub, createOrmStub, db;

    beforeEach(() => {

        loadOrmStub = sinon.stub(Db.prototype, "_loadOrm", () => {});
        createOrmStub = sinon.stub(Db.prototype, "_createOrm", () => {});
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

    afterEach(() => {

        loadOrmStub.restore();
        createOrmStub.restore();

    });

    it("Should call load ORM", () => {

        assert.isTrue(loadOrmStub.calledOnce, "Load ORM method should be called");

    });

    it("Should call load ORM", () => {

        assert.isTrue(createOrmStub.calledOnce, "Create ORM method should be called");

    });

    it("Should not call load ORM", () => {

        loadOrmStub.reset();

        new Db({
            enabled: false,
            ormName: "waterline",
            adapterName: "teo.db.adapter.waterline",
            adapterConfig: {}
        });

        assert.isFalse(loadOrmStub.calledOnce, "Load ORM method should not be called");

    });

    it("Should not call load ORM", () => {

        createOrmStub.reset();

        new Db({
            enabled: false,
            ormName: "waterline",
            adapterName: "teo.db.adapter.waterline",
            adapterConfig: {}
        });

        assert.isFalse(createOrmStub.calledOnce, "Create ORM method should not be called");

    });

    it("Should parse config correctly", () => {

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

    it("Should load ORM", () => {

        loadOrmStub.restore();

        db._loadOrm();

        assert.isFunction(db.waterline, "Should be a function");

    });

    it("Should create ORM instance", () => {

        loadOrmStub.restore();
        createOrmStub.restore();

        db._loadOrm();
        db._createOrm();

        assert.instanceOf(db.orm, db.waterline, "Created ORM should be an instance of Waterline ORM");

    });

    it("Should connect DB", async(function* () {

        loadOrmStub.restore();
        createOrmStub.restore();

        db._loadOrm();
        db._createOrm();

        let connectStub = sinon.stub(db.getOrm(), "connect", function* () {});

        yield* db.connect();

        assert.isTrue(connectStub.calledOnce, "Connect method should be called");

        connectStub.restore();

    }));

    it("Should disconnect DB", async(function* () {

        loadOrmStub.restore();
        createOrmStub.restore();

        db._loadOrm();
        db._createOrm();

        var disconnectStub = sinon.stub(db.getOrm(), "disconnect", function* () {});

        yield* db.disconnect();

        assert.isTrue(disconnectStub.calledOnce, "Disconnect method should be called");

        disconnectStub.restore();

    }));

});