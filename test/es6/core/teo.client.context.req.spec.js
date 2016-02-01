/*!
 * teo.client.context.req spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 2/1/16
 */

"use strict";

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase, teoLibDir  */

const http = require("http"),
    ReqContext = require(teoBase + "/teo.client.context.req");

describe("Testing teo.client.context.req", () => {

    let server, req, res, reqContext, parseBodySpy, parseFormSpy, reqOnSpy;

    beforeEach(async(function* () {

        server = http.createServer((_req, _res) => {
            req = _req;
            res = _res;

            reqOnSpy = sinon.spy(req, "on");

            res.end();
        }).listen(3210);

        parseBodySpy = sinon.spy(ReqContext.prototype, "parseBody");
        parseFormSpy = sinon.spy(ReqContext.prototype, "parseForm");

        yield function(callback) {
            server.once("listening", () => {
                http.get("http://localhost:3210", () => {
                    reqContext = new ReqContext({req: req});
                    callback();
                });
            });
        };

    }));

    afterEach(async(function* () {

        req = null;
        res = null;
        reqContext = null;
        parseBodySpy.restore();
        parseFormSpy.restore();
        reqOnSpy.restore();

        yield function(callback) {
            server.close(callback);
        };

    }));

    it("Should define required object properties in constructor", () => {

        assert.isArray(reqContext.chunks);
        assert.isObject(reqContext.parsedUrl);
        assert.isString(reqContext.pathname);
        assert.isUndefined(reqContext.contentType);
        assert.isObject(reqContext.query);

        assert.isTrue(parseBodySpy.calledOnce);

    });

    it("Should return original req object", () => {

        assert.equal(reqContext.req, req);

    });

    it("Should parse form if content type starts with 'multipart'", () => {

        reqContext.parseBody();

        assert.isFalse(parseFormSpy.called);

        reqContext.contentType = "multipart/form";

        reqContext.parseBody();

        assert.isTrue(parseFormSpy.calledOnce);

    });

    it("Should listen to 'end' & 'data' events if not multipart", () => {

        reqOnSpy.reset();

        reqContext.contentType = "multipart/form";

        reqContext.parseBody();

        assert.isFalse(reqOnSpy.called);

        reqContext.contentType = null;

        reqContext.parseBody();

        assert.isTrue(reqOnSpy.calledTwice);

        assert.equal(reqOnSpy.args[0][0], "data", "Event name should be correct");
        assert.isFunction(reqOnSpy.args[0][1], "Event handler should be passed");

        assert.equal(reqOnSpy.args[1][0], "end", "Event name should be correct");
        assert.isFunction(reqOnSpy.args[1][1], "Event handler should be passed");


    });

});