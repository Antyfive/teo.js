/*!
 * Teo spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

const Teo = require(teoBase + "/teo"),
	TeoCore = require(teoBase + "/teo.core"),
    _ = require(teoBase + "/teo.utils"),
	events = require("events");

describe("Testing Teo Main Entry Point", () => {

	let teo;

	beforeEach(() => {

		teo = new Teo({
			mode: "test",
            homeDir: "testDir"
		});

	});

	afterEach(() => {

		teo = null;

	});

	it("Should create new instance of Teo.js", () => {

		assert.instanceOf(teo, Teo, "Should be an instance of Teo class");

	});

	it("Should parse passed full config correctly", () => {

		assert.equal(teo.mode, "test", "Mode should be set correctly");
		assert.equal(teo.homeDir, "testDir", "Home dir should be set correctly");
		assert.equal(teo.appsDir, "testDir/apps", "Apps dir should be set correctly");
		assert.equal(teo.confDir, "testDir/config", "Test dir should be set correctly");

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

        teo.core.coreAppConfig = {
            get: sinon.stub()
        };

        teo.core.coreAppConfig.get.withArgs("cluster").returns({
            enabled: false
        });

        let callbackStub = sinon.stub();
        let promise = teo.start(null, callbackStub);

        promise.then(function() {

            assert.isTrue(callbackStub.calledOnce);
            done();

        });

    });
});