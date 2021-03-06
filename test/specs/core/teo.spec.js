/*!
 * Teo spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

"use strict";

const Teo = require(teoBase + "/teo"),
	TeoCore = require(teoBase + "/teo.core"),
    _ = require(teoBase + "/../lib/utils"),
    TeoCluster = require(teoBase + "/teo.cluster"),
    cluster = require("cluster"),
	events = require("events"),
    co = require("co"),
    async = generator => done => co(generator).then(done, done);

describe("Testing Teo Main Entry Point", () => {

	let teo, dir;

	beforeEach(() => {

        dir = process.cwd().replace(/\\/g, "/");

		teo = new Teo({
			mode: "test",
            homeDir: dir
		});

        teo.core.app = {
            config: {
                get: sinon.stub()
            }
        };

	});

	afterEach(() => {

		teo = null;
        dir = null;

	});

	it("Should create new instance of Teo.js", () => {

		assert.instanceOf(teo, Teo, "Should be an instance of Teo class");

	});

	it("Should parse passed full config correctly", () => {

		assert.equal(teo.mode, "test", "Mode should be set correctly");
		assert.equal(teo.homeDir, dir, "Home dir should be set correctly");
		assert.equal(teo.appsDir, dir + "/apps", "Apps dir should be set correctly");
		assert.equal(teo.confDir, dir + "/config", "Test dir should be set correctly");

	});

	it("Should have core instance", () => {

		assert.instanceOf(teo.core, TeoCore, "Should be an instance of Teo core class");

	});

	it("Should call callback when core created", async(function* () {

        var callbackStub = sinon.stub(teo, "callback", function() {
            assert.isFalse(teo.callback.calledOnce, "Callback should be called once");
            callbackStub.restore();
            done();
        });

		yield* teo.createCore();

	}));

	it("Should emit 'ready' event when core was initialized", async(function* () {

		var emitSpy = sinon.stub(teo, "emit", function() {

            assert.isTrue(emitSpy.called, "Emit method should be called once");
            assert.equal(emitSpy.args[0][0], "ready", "Event name should be correct");
            assert.instanceOf(emitSpy.args[0][1], Teo, "Teo instance should be passed as an argument");

            emitSpy.restore();

        });

		yield* teo.createCore();

	}));

	it("Should start application", async(function* () {

        teo.core.app.config.get.withArgs("cluster").returns({
            enabled: false
        });

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let startCoreSpy = sinon.spy(teo.core, "start");
        let _createClusterSpy = sinon.spy(teo, "_createCluster");

        yield* teo.start("test");

        assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
        assert.isTrue(startCoreSpy.calledOnce);
        assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
        assert.equal(runAppLifeCircleActionSpy.args[0][1], "start", "Action name should be correct");

        assert.isFalse(_createClusterSpy.called, "Shouldn't call ._createClusterSpy");

        runAppLifeCircleActionSpy.restore();
        startCoreSpy.restore();
        _createClusterSpy.restore();

    }));

    it("Should start application and initialize cluster", async(function* () {

        teo.core.app.config.get.withArgs("cluster").returns({enabled: true});

        let _createClusterStub = sinon.stub(teo, "_createCluster", (callback) => callback());

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let startCoreSpy = sinon.spy(teo.core, "start");

        yield* teo.start("test");

        assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
        assert.isTrue(startCoreSpy.calledOnce);
        assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
        assert.equal(runAppLifeCircleActionSpy.args[0][1], "start", "Action name should be correct");

        assert.isTrue(_createClusterStub.calledOnce, "Should call ._createClusterSpy");

        _createClusterStub.restore();
        runAppLifeCircleActionSpy.restore();
        startCoreSpy.restore();

    }));

    it("Should stop application", async(function* () {

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let stopCoreSpy = sinon.spy(teo.core, "stop");
        yield* teo.stop("test");

        assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
        assert.isTrue(stopCoreSpy.calledOnce);
        assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
        assert.equal(runAppLifeCircleActionSpy.args[0][1], "stop", "Action name should be correct");

        runAppLifeCircleActionSpy.restore();
        stopCoreSpy.restore();

    }));

    it("Should restart application", async(function* () {

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let restartCoreSpy = sinon.spy(teo.core, "restart");
        yield* teo.restart("test");

        assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
        assert.isTrue(restartCoreSpy.calledOnce);
        assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
        assert.equal(runAppLifeCircleActionSpy.args[0][1], "restart", "Action name should be correct");

        runAppLifeCircleActionSpy.restore();
        restartCoreSpy.restore();


    }));

    it("Should shutdown application", async(function* () {

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let shutdownSpy = sinon.spy(teo.core, "shutdown");
        yield* teo.shutdown();

        assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
        assert.isTrue(shutdownSpy.calledOnce);
        assert.equal(runAppLifeCircleActionSpy.args[0][0], undefined, "App's name should be undefined");
        assert.equal(runAppLifeCircleActionSpy.args[0][1], "shutdown", "Action name should be correct");

        runAppLifeCircleActionSpy.restore();
        shutdownSpy.restore();

    }));

    it("Should throw error for unknown life circle action", (done) => {

        co(teo._runAppLifeCircleAction.bind(teo, "appname", "action")).catch((err) => {

            assert.equal(err.message, "Not supported action 'action' was received");

            done();
        })
    });

    it("Should create a cluster", () => {

        cluster.isMaster = false;

        let clusterInstance = teo._createCluster(() => {});

        assert.instanceOf(clusterInstance, TeoCluster, "Should be instance of TeoCluster");

        cluster.isMaster = true;

    });

});