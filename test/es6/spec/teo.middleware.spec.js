/*!
 * Teo.js middleware spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/15/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    Middleware = require(`${teoBase}/teo.middleware`),
    co = require("co"),
    // generator test case
    async = generator => done => co(generator).then(done, done);

describe("Testing Teo Middleware", () => {

    let middleware;

    beforeEach(() => {

        middleware = new Middleware();

    });

    afterEach(() => {

        middleware = null;

    });

    it("Should return length of middleware", () => {

        assert.equal(middleware.length, 0);

    });

    it("Should add middleware function", () => {

        middleware.add(function* () {});

        assert.equal(middleware.length, 1);

    });

    it("Should run middlewares", async(function* (next) {

        let stub = sinon.stub();

        middleware.add(function* (next) {
            stub();
            yield* next;
        });

        yield function(callback) {
            middleware.run(function* (next) {
                yield* next;
            }, this).then(callback);
        };

        assert.isTrue(stub.calledOnce);

    }));

});