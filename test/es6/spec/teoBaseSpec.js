/*!
 * Base class tests
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 17/6/14
 */

const Base = require(teoBase + "/teo.base"),
	events = require("events");

describe("Testing Teo Base Class", () => {

	it("Should inherit from EventEmitter", () => {

		let base = new Base();

		assert.instanceOf(base.__proto__, events.EventEmitter, "Should inherit EventEmiiter");

	});

	it("Should create instance of base class", () => {

		let base = new Base({
			test: "test"
		}, function() {});

		assert.instanceOf(base, Base, "Should be instance of Base class");
		assert.deepEqual(base.config, {test: "test"}, "Options object should be equal");
		assert.isFunction(base.callback, "Should be a function");

	});

	it("Should initialize with only callback passed as first argument", () => {

		let base = new Base(function() {});

		assert.deepEqual(base.config, {}, "Should be an empty object");
		assert.isFunction(base.callback, "Callback should be function");

	});

	it("Should initialize with only object passed as first argument", () => {

		let base = new Base({test: "test"});

		assert.deepEqual(base.config, {test: "test"}, "Should be an empty object");
		assert.isFunction(base.callback, "Callback should be function");

	});

 });