/*!
 * teo.client.context.req spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 2/1/16
 */

"use strict";

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase, teoLibDir  */

const http = require("http"),
    ReqContext = require(teoBase + "/teo.client.context.req"),
    querystring = require("querystring"),
    multiparty = require("multiparty");

describe("Testing teo.client.context.req", () => {

    let server, req, res, reqContext, parseBodySpy, parseFormSpy, reqOnSpy, jsonParseStub, querystringParseStub;

    beforeEach(async(function* () {

        server = http.createServer((_req, _res) => {
            req = _req;
            res = _res;

            reqOnSpy = sinon.spy(req, "on");

            res.end();
        }).listen(3210);

        parseBodySpy = sinon.spy(ReqContext.prototype, "parseBody");
        parseFormSpy = sinon.spy(ReqContext.prototype, "parseForm");

        jsonParseStub = sinon.stub(JSON, "parse");
        querystringParseStub = sinon.stub(querystring, "parse");

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

        jsonParseStub.restore();
        querystringParseStub.restore();

    }));

    it("Should define required object properties in constructor", () => {

        assert.isArray(reqContext.chunks);
        assert.isObject(reqContext.parsedUrl);
        assert.isString(reqContext.pathname);
        assert.isString(reqContext.contentType);
        assert.isObject(reqContext.query);

        assert.isTrue(parseBodySpy.calledOnce);

    });

    it("Should return original req object", () => {

        assert.equal(reqContext.req, req);

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

    it("Should add chunk on data event", () => {

        assert.equal(reqContext.chunks.length, 0);

        req.emit("data", 1);

        assert.equal(reqContext.chunks.length, 1);

    });

    it("Should handle request end event and parse json body", () => {

        jsonParseStub.returns({test: true});

        reqContext.contentType = "application/json";

        reqContext.chunks.push(new Buffer(1));

        req.emit("end");

        assert.isTrue(jsonParseStub.calledOnce);
        assert.deepEqual(req.body, {test: true});

    });

    it("Should try to parse query string of it's not json", () => {

        querystringParseStub.returns({test: true});

        reqContext.chunks.push(new Buffer(1));

        reqContext.contentType = "myType";

        req.emit("end");

        assert.isTrue(querystringParseStub.calledOnce);
        assert.deepEqual(req.body, {test: true});

    });

    it("Should remove listeners on request end", () => {

        let cleanupSpy = sinon.spy(reqContext, "cleanup");

        req.emit("end");

        assert.isTrue(cleanupSpy.calledOnce);

        cleanupSpy.restore();

    });

    it("Should set req params", () => {

        reqContext.params = "123";

        assert.equal(req.params, "123");

    });

    it("Should log an error if body parsing threw an error", () => {

        let loggerErrorStub = sinon.spy(logger, "error");

        reqContext.chunks.push(new Buffer(1));

        querystringParseStub.throws("Test error");

        req.emit("end");

        assert.isTrue(loggerErrorStub.calledOnce);

        loggerErrorStub.restore();

    });

    it("Should create a form parser", () => {

        let formParser = ReqContext.createFormParser();

        assert.instanceOf(formParser, multiparty.Form, "Should be instance of multiparty.Form");

    });

    describe("Parse multipart", () => {

        let createFormParserStub, parseStub, files, fields, apiStub;

        beforeEach(() => {

            parseStub = sinon.stub();

            fields = ["testField"];
            files = ["testFile"];

            apiStub = {
                parse(_req, callback) {
                    assert.equal(_req, req, "Should pass request object");
                    callback(null, fields, files);
                }
            };

            createFormParserStub = sinon.stub(ReqContext, "createFormParser");
            createFormParserStub.returns(apiStub);

        });

        afterEach(() => {

            createFormParserStub.restore();
            parseStub = null;
            fields = null;
            files = null;

        });

        it("Shouldn't parse form if content type isn't multipart", async(function* () {

            let res = yield* reqContext.parseForm();

            assert.isUndefined(res);

        }));

        it("Should parse request with multipart content type", async(function* () {

            reqContext.contentType = "multipart/*";

            let result = yield* reqContext.parseForm();

            assert.deepEqual(req.fields, result.fields, "Fields should be saved in the req object");
            assert.deepEqual(req.files, result.files, "Files should be saved in the req object");
            assert.deepEqual(result, {fields, files}, "Promise should be resolved with fields and files");

        }));

        it("Should handle errors on parsing", async(function* () {

            let parseError;

            reqContext.contentType = "multipart/*";

            apiStub.parse = (_req, callback) => {
                assert.equal(_req, req, "Should pass request object");
                callback(new Error("Test error"), fields, files);
            };

            createFormParserStub.returns(apiStub);

            try {

                yield* reqContext.parseForm();

            } catch(err) {

                parseError = err;

            }

            assert.equal(parseError.message, "Test error", "Promise should be rejected");

        }));

    });
    
});