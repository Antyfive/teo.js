/*!
 * Teo spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

const Teo = require(teoBase + "/teo"),
	TeoCore = require(teoBase + "/teo.core"),
	events = require("events");

describe("Testing Teo Main Entry Point", () => {

	let teo, createCoreStub;

	beforeEach(() => {

		teo = new Teo({
			mode: "test",
			homeDir: "testDir"
		});
		createCoreStub = sinon.stub(Teo.prototype, "createCore", () => {});

	});

	afterEach(() => {

		teo = null;
		createCoreStub.restore();

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

		var callbackSpy = sinon.spy(teo, "callback");

		createCoreStub.restore();	

		teo.createCore();

		process.nextTick(() => {

			assert.isTrue(callbackSpy.calledOnce, "Callback should be called once");
			done();

		});

	});

	it("Should emit 'ready' event when core was initialized", () => {

		var emitSpy = sinon.spy(teo, "emit");

		createCoreStub.restore();

		teo.createCore();

		process.nextTick(() => {

			assert.isTrue(emitSpy.called, "Emit method should be called once");							
			assert.equal(emitSpy.args[1][0], "ready", "Event name should be correct");							
			assert.deepEqual(emitSpy.args[1][1], teo, "Teo instance should be passed as an argument");							

		});

	});
});