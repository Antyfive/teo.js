/*!
 * Teo.js middleware spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/17/15
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var Middleware = require(teoBase + "/teo.middleware"),
    async = require("async");

describe("Testing Middleware", function() {

    var middleware;

    beforeEach(function() {

        middleware = new Middleware();

    });

    afterEach(function() {

        middleware = null;

    });

    it("Should throw an error when not a function is added as middleware", function() {

        assert.throw(middleware.add, "Trying to add not a function as a middleware!");

    });

    it("Should add a middleware function", function() {

        middleware.add(function() {

        });

        assert.equal(middleware._middleware.length, 1, "Middleware function should be added");

    });

    it("Should run middleware functions", function(done) {

        var funct1 = sinon.spy(function(req, res, next) {
                next();
            }),
            funct2 = sinon.spy(function(req, res, next) {
                next();
            }),
            obj1 = {
                test1: "1"
            },
            obj2 = {
                test2: "2"
            },
            callback = sinon.spy(function() {}),
            waterfallSpy = sinon.spy(async, "waterfall");

        middleware.add(funct1);
        middleware.add(funct2);

        middleware.run(obj1, obj2, callback);

        setTimeout(function() {

            assert.isTrue(waterfallSpy.calledOnce, "Chain should be called once");

            assert.isTrue(funct1.calledOnce, "First middleware function should be called");
            assert.deepEqual(funct1.args[0][0], obj1, "First argument of first middleware function should be correct");
            assert.deepEqual(funct1.args[0][1], obj2, "Second argument of first middleware function  should be correct");

            assert.isTrue(funct2.calledOnce, "Second middleware function should be called");
            assert.deepEqual(funct2.args[0][0], obj1, "First argument of second middleware function should be correct");
            assert.deepEqual(funct2.args[0][1], obj2, "Second argument of second middleware function should be correct");

            waterfallSpy.restore();

            done();

        }, 100);

    });

    it("Should run callback immediately if there is no middleware", function(done) {

        var callbackSpy = sinon.spy(function() {});
        var waterfallSpy = sinon.spy(async, "waterfall");

        middleware.run({}, {}, callbackSpy);

        setTimeout(function() {

            assert.isTrue(callbackSpy.calledOnce, "Callback should be called");
            assert.isFalse(waterfallSpy.called, "Chain should not be called");

            waterfallSpy.restore();

            done();

        }, 100);

    });

    it("Should count middleware functions", function() {

        middleware.add(function() {});

        assert.equal(middleware.count(), 1, "Length of middleware array should be returned");

    });

});
