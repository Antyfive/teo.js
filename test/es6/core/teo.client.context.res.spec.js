/*!
 * teo.client.context.res.spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 2/2/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const http = require("http"),
    ResContext = require(teoBase + "/teo.client.context.res"),
    Stream = require("stream");

describe("Testing teo.client.context.res", () => {

    let server, req, res, resContext;

    beforeEach(async(function* () {

        server = http.createServer((_req, _res) => {
            req = _req;
            res = _res;

            res.end();
        }).listen(3210);


        yield function(callback) {
            server.once("listening", () => {
                http.get("http://localhost:3210", () => {
                    resContext = new ResContext({req, res});
                    callback();
                });
            });
        };

    }));

    afterEach(async(function* () {

        req = null;
        res = null;
        resContext = null;

        yield function(callback) {
            server.close(callback);
        };

    }));

    it("Should get pure req object", () => {

        assert.equal(resContext.req, req);

    });

    it("Should get req pathname", () => {

        req.pathname = "/123";

        assert.equal(resContext.pathname, req.pathname);

    });

    it("Should send json response", () => {

        let setHeaderStub = sinon.stub(resContext.res, "setHeader", () => {});
        let sendStub = sinon.stub(resContext, "send", () => {});

        resContext.json({test: true});

        assert.isTrue(setHeaderStub.calledOnce);
        assert.deepEqual(setHeaderStub.args[0], ["Content-Type", "application/json"], "setHeader() arguments should be correct");

        assert.isTrue(sendStub.calledOnce);
        assert.deepEqual(sendStub.args[0], [200, {test: true}, "json"], "send() arguments should be correct");

        setHeaderStub.restore();
        sendStub.restore();

    });

    describe("send()", () => {

        let resEndStub, writeHeadStub;

        beforeEach(() => {

            resEndStub = sinon.stub(resContext.res, "end", () => {});
            writeHeadStub = sinon.stub(resContext.res, "writeHead", () => {});

        });

        afterEach(() => {

            resEndStub.restore();
            writeHeadStub.restore();

        });

        it("Should set response code to 200 if it wasn't passed", () => {

            resContext.send();

            assert.isTrue(resEndStub.calledOnce);
            assert.deepEqual(resEndStub.args[0], ["OK"], "Response status text should be correct");

            assert.isTrue(writeHeadStub.calledOnce);
            assert.deepEqual(writeHeadStub.args[0], [200, {
                "Content-Length": 2,
                "Content-Type": "application/octet-stream; charset=UTF-8"
            }]);

        });

        it("Should send body passed in the first argument", () => {

            resContext.send("my body");

            assert.isTrue(resEndStub.calledOnce);
            assert.deepEqual(resEndStub.args[0], ["my body"], "Response text should be correct");

            assert.isTrue(writeHeadStub.calledOnce);
            assert.deepEqual(writeHeadStub.args[0], [200, {
                "Content-Length": 7,
                "Content-Type": "application/octet-stream; charset=UTF-8"
            }]);

        });

        it("Should send response if buffer instance was passed", () => {

            let body = new Buffer("test");

            resContext.send(body);

            assert.isTrue(resEndStub.calledOnce);
            assert.deepEqual(resEndStub.args[0], [body], "Response body should be correct");

            assert.isTrue(writeHeadStub.calledOnce);
            assert.deepEqual(writeHeadStub.args[0], [200, {
                "Content-Length": 4,
                "Content-Type": "application/octet-stream; charset=UTF-8"
            }]);

        });

        describe("Two arguments", () => {

            it("Should send response with two arguments", () => {

                resContext.send(500, "my body");

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0], ["my body"], "Response text should be correct");

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [500, {
                    "Content-Length": 7,
                    "Content-Type": "application/octet-stream; charset=UTF-8"
                }]);

            });

            it("Should set response code if wrong code was passed as first argument", () => {

                resContext.send(999, "my body");

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0], ["my body"], "Response text should be correct");

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [200, {
                    "Content-Length": 7,
                    "Content-Type": "application/octet-stream; charset=UTF-8"
                }]);

            });

        });

        describe("MIME", () => {

            it("Should send MIME type based on the req.pathname", () => {

                req.pathname = "/smth.txt";

                resContext.send();

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0], ["OK"], "Response status text should be correct");

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [200, {
                    "Content-Length": 2,
                    "Content-Type": "text/plain; charset=UTF-8"
                }]);

            });

            it("Should send MIME type based on the third argument", () => {

                resContext.send(200, "ok", "txt");

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0], ["ok"], "Response body should be correct");

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [200, {
                    "Content-Length": 2,
                    "Content-Type": "text/plain; charset=UTF-8"
                }]);

            });

            it("Should send mime based on req.headers.accept header", () => {

                req.headers.accept = "json";

                res.send();

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0], ["{\"code\":200,\"message\":\"OK\"}"], "Response body should be correct");

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [200, {
                    "Content-Length": 27,
                    "Content-Type": "application/json; charset=UTF-8"
                }]);

            });

            it("Should send json if response body is object", () => {

                res.send({test: true});

                assert.isTrue(resEndStub.calledOnce);
                assert.deepEqual(resEndStub.args[0],
                    ["{\"code\":200,\"data\":{\"test\":true},\"message\":\"OK\"}"],
                    "Response body format should be correct"
                );

                assert.isTrue(writeHeadStub.calledOnce);
                assert.deepEqual(writeHeadStub.args[0], [200, {
                    "Content-Length": 48,
                    "Content-Type": "application/json; charset=UTF-8"
                }]);

            });

        });

        it("Should pipe response if body is a stream", () => {

            let stream = new Stream();

            let pipeSpy = sinon.stub(Stream.prototype, "pipe");

            resContext.send(stream);

            assert.isTrue(pipeSpy.calledOnce);

            pipeSpy.restore();

        });

        it("Shouldn't send body for HEAD req method", () => {

            req.method = "HEAD";

            resContext.send("body");

            assert.isTrue(resEndStub.calledOnce);
            assert.isUndefined(resEndStub.args[0][0], "Response body format should be empty");

            assert.isTrue(writeHeadStub.calledOnce);
            assert.deepEqual(writeHeadStub.args[0], [200, {
                "Content-Length": 4,
                "Content-Type": "application/octet-stream; charset=UTF-8"
            }]);


        });

    });

});