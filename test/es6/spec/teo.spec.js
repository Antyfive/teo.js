/*!
 * Teo spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

const Teo = require(teoBase + "/teo"),
	TeoCore = require(teoBase + "/teo.core"),
    _ = require(teoBase + "/teo.utils"),
	events = require("events"),
    co = require("co");

describe("Testing Teo Main Entry Point", () => {

	let teo, dir;

	beforeEach(() => {

        dir = process.cwd().replace(/\\/g, "/");
		teo = new Teo({
			mode: "test",
            homeDir: dir
		});

        teo.core.coreAppConfig = {
            get: sinon.stub()
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

	it("Should call callback when core created", (done) => {

        var callbackStub = sinon.stub(teo, "callback", function() {
            assert.isFalse(teo.callback.calledOnce, "Callback should be called once");
            callbackStub.restore();
            done();
        });

		teo.createCore();

	});

	it("Should emit 'ready' event when core was initialized", (done) => {

		var emitSpy = sinon.stub(teo, "emit", function() {

            assert.isTrue(emitSpy.called, "Emit method should be called once");
            assert.equal(emitSpy.args[0][0], "ready", "Event name should be correct");
            assert.instanceOf(emitSpy.args[0][1], Teo, "Teo instance should be passed as an argument");

            emitSpy.restore();

            done();

        });

		teo.createCore();
	});

	it("Should start application", (done) => {

        teo.core.coreAppConfig.get.withArgs("cluster").returns({
            enabled: false
        });

        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let startCoreSpy = sinon.spy(teo.core, "start");
        let callbackStub = sinon.stub();
        let promise = teo.start("test", callbackStub);

        promise.then(function() {

            assert.isTrue(callbackStub.calledOnce);
            assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
            assert.isTrue(startCoreSpy.calledOnce);
            assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
            assert.equal(runAppLifeCircleActionSpy.args[0][1], "start", "Action name should be correct");
            assert.isFunction(runAppLifeCircleActionSpy.args[0][2]);

            runAppLifeCircleActionSpy.restore();
            startCoreSpy.restore();

            done();

        });

    });

    it("Should stop application", (done) => {

        let callbackStub = sinon.stub();
        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let stopCoreSpy = sinon.spy(teo.core, "stop");
        let promise = teo.stop("test", callbackStub);

        promise.then(function() {

            assert.isTrue(callbackStub.calledOnce);
            assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
            assert.isTrue(stopCoreSpy.calledOnce);
            assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
            assert.equal(runAppLifeCircleActionSpy.args[0][1], "stop", "Action name should be correct");
            assert.isFunction(runAppLifeCircleActionSpy.args[0][2]);

            runAppLifeCircleActionSpy.restore();
            stopCoreSpy.restore();

            done();

        });

    });

    it("Should restart application", (done) => {

        let callbackStub = sinon.stub();
        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let restartCoreSpy = sinon.spy(teo.core, "restart");
        let promise = teo.restart("test", callbackStub);

        promise.then(function() {

            assert.isTrue(callbackStub.calledOnce);
            assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
            assert.isTrue(restartCoreSpy.calledOnce);
            assert.equal(runAppLifeCircleActionSpy.args[0][0], "test", "App's name should be correct");
            assert.equal(runAppLifeCircleActionSpy.args[0][1], "restart", "Action name should be correct");
            assert.isFunction(runAppLifeCircleActionSpy.args[0][2]);

            runAppLifeCircleActionSpy.restore();
            restartCoreSpy.restore();

            done();

        });

    });

    it("Should shutdown application", (done) => {

        let callbackStub = sinon.stub();
        let runAppLifeCircleActionSpy = sinon.spy(teo, "_runAppLifeCircleAction");
        let shutdownSpy = sinon.spy(teo.core, "shutdown");
        let promise = teo.shutdown(callbackStub);

        promise.then(function() {

            assert.isTrue(callbackStub.calledOnce);
            assert.isTrue(runAppLifeCircleActionSpy.calledOnce);
            assert.isTrue(shutdownSpy.calledOnce);
            assert.equal(runAppLifeCircleActionSpy.args[0][0], undefined, "App's name should be undefined");
            assert.equal(runAppLifeCircleActionSpy.args[0][1], "shutdown", "Action name should be correct");
            assert.isFunction(runAppLifeCircleActionSpy.args[0][2]);

            runAppLifeCircleActionSpy.restore();
            shutdownSpy.restore();

            done();

        });

    });

    it("Should throw error for unknown life circle action", (done) => {

        co(teo._runAppLifeCircleAction.bind(teo, "appname", "action")).catch((err) => {

            assert.equal(err.message, "Not supported action 'action' was received");

            done();
        })
    });

});