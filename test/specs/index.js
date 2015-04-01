/*!
 * Framework entry point spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/31/2015
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon  */

var TeoJS = require("../../core");

describe("Testing Teo.js Framework", function() {
    var app, emitSpy;

    describe("Testing Framework Initialization", function() {

        beforeEach(function(done) {
            app = new TeoJS(function(){
                // emit of "ready" event is called on process.nextTick
                process.nextTick(function() {

                    emitSpy = sinon.spy(app, "emit");
                    done();

                });

            });

        });

        afterEach(function() {

            app = null;
            emitSpy.restore();

        });

        it("Should be a function", function() {

            assert.isTrue(typeof TeoJS === "function", "TeoJS not a function");

        });

        it("Should be initialised", function() {

            process.nextTick(function() {

                assert.equal(emitSpy.args[0][0], "ready", "Framework should fire ready event");
                assert.deepEqual(emitSpy.args[0][1], app, "Framework instance should be passed as argument");
                assert.equal(emitSpy.calledOnce, true, "Framework should call callback function on initialise");

            });

        });

        it("Should have applications prepared", function() {

            assert.equal(Object.keys(app.core.getApps()).length > 0, true, "Applications should be prepared");

        });

        it("Should start applications", function() {

            var coreStartStub = sinon.stub(app.core, "start", function() {});

            app.start();

            assert.isTrue(coreStartStub.calledOnce, "Core start method should be called");

            coreStartStub.restore();

        });

        it("Should stop applications", function() {

            var coreStopStub = sinon.stub(app.core, "stop", function() {});

            app.stop();

            assert.isTrue(coreStopStub.calledOnce, "Core stop method should be called");

            coreStopStub.restore();

        });

    });
});