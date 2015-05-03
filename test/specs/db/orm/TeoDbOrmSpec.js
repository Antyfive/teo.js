/*!
 * Orm spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/1/15
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var Orm = require("../../" + teoBase + "/db/orm/teo.db.orm");

describe("Testing Db ORM", function() {

    var orm;

    beforeEach(function() {

        orm = new Orm({
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

        orm = null;

    });

    it("Should correctly initialize ORM", function() {

        var parseConfigSpy = sinon.spy(orm, "parseConfig");
        var loadOrmSpy = sinon.spy(orm, "loadOrm");
        var loadAdapterSpy = sinon.spy(orm, "loadAdapter");
        var createAdapterSpy = sinon.spy(orm, "createAdapter");

        orm.initialize({
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

        assert.isTrue(parseConfigSpy.calledOnce, "Parse config should be called once");
        assert.isTrue(loadOrmSpy.calledOnce, "Load ORM method should be called");
        assert.isTrue(loadAdapterSpy.calledOnce, "Load adapter should be called");
        assert.isTrue(createAdapterSpy.calledOnce, "Create adapter method should be called");

        parseConfigSpy.restore();
        loadOrmSpy.restore();
        loadAdapterSpy.restore();
        createAdapterSpy.restore();

    });

    it("Should throw error on adapter loading", function() {

        function test() {
            orm.initialize({
                ormName: "waterline",
                adapterName: "fakeAdapter",
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
        }

        assert.throw(test, "Cannot find module '../adapters/fakeAdapter'");

    });

    it("Should throw error on adapter creation", function() {

        function test() {
            orm.initialize({
                ormName: "waterline",
                adapterName: "fakeAdapter",
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
        }

        assert.throw(test, "Cannot find module '../adapters/fakeAdapter'");

    });

    it("Should throw error on ORM loading", function() {

        function test() {
            orm.initialize({
                ormName: "fakeOrm",
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
        }

        assert.throw(test, "Cannot find module 'fakeOrm'");

    });


    it("Should be created adapter", function() {

        var Adapter = require("../../" + teoBase + "/db/adapters/teo.db.adapter.waterline");

        assert.instanceOf(orm[orm.adapterName], Adapter, "Should be an instance of waterline adapter");

    });

    it("Should return adapter via getter", function() {

        var Adapter = require("../../" + teoBase + "/db/adapters/teo.db.adapter.waterline");

        assert.instanceOf(orm.getAdapter(), Adapter, "Should be an instance of waterline adapter");

    });


    it("Should parse config correctly", function() {

        var loadAdapterDependenciesSpy = sinon.spy(orm, "loadAdapterDependencies");
        var parseConfig = {
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
        };

        var config = orm.parseConfig(parseConfig);

        assert.deepEqual(config, {
            adapterPath: "../adapters",
            ormName: parseConfig.ormName,
            adapterConfig: {
                adapters: {
                    "default": require("sails-disk"),
                    disk: require("sails-disk"),
                    mysql: require("sails-mysql")
                },
                // Setup connections using the named adapter configs
                connections: parseConfig.adapterConfig.connections
            },
            adapterName: parseConfig.adapterName
        }, "Config object should be correct");


        loadAdapterDependenciesSpy.restore();

    });

    it("Should connect DB via adapter", function(done) {

        var adapter = orm.getAdapter();
        var connectAdapterStub = sinon.stub(adapter, "connect", function(callback) {
            callback(null, {connections: "testConnection", collections: "collection"});
        });

        orm.connect(function() {

            assert.isTrue(connectAdapterStub.calledOnce, "Connect adapter method should be called");

            assert.equal(orm._connections, "testConnection", "Connections should be saved");
            assert.equal(orm._collections, "collection", "Collections should be saved");

            connectAdapterStub.restore();

            done();

        });

    });

    it("Should throw error on connection", function() {

        var adapter = orm.getAdapter();
        var connectAdapterStub = sinon.stub(adapter, "connect", function(callback) {
            callback({message: "Test error"}, {connections: "testConnection", collections: "collection"});
        });

        function connect() {
            orm.connect();
        }

        assert.throws(connect, "Test error");

        connectAdapterStub.restore();


    });

    it("Should return all loaded collections", function() {

        orm._collections = {"test": true};

        assert.deepEqual(orm.collections(), {"test": true}, "Collections object should be returned")

    });

    it("Should return collection by it's name", function() {

        orm._collections = {"test": true};

        assert.deepEqual(orm.collection("test"), true, "Single collection should be returned")

    });

    it("Should disconnect DB", function(done) {

        var disconnectStub = sinon.stub(orm.getAdapter(), "disconnect", function(cb) {
           cb();
        });

        orm.disconnect(function() {

            assert.isTrue(disconnectStub.calledOnce, "Adapter's disconnect method should be called once");

            disconnectStub.restore();

            done();

        });

    });

    it("Should log error on disconnect", function(done) {

        var loggerStub = sinon.spy(logger, "error");
        var disconnectStub = sinon.stub(orm.getAdapter(), "disconnect", function(cb) {
            cb(true);
        });

        orm.disconnect(function() {

            assert.isTrue(loggerStub.calledOnce, "Error should be logged");

            loggerStub.restore();
            disconnectStub.restore();

            done();

        });


    });

});