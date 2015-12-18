/*!
 * Teo.js client spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/8/15
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    http = require("http"),
    composition = require("composition"),
    mime = require("mime"),
    co = require("co"),
    Client = require(`${teoBase}/teo.client`),
    ClientContext = require(`${teoBase}/teo.client.context`),
    ClientContextRes = require(`${teoBase}/teo.client.context.res`),
    ClientContextReq = require(`${teoBase}/teo.client.context.req`),
    streamer = require(`${teoBase}/teo.client.streamer`),
    _ = require(`${teoBase}/teo.utils`),
    fileReader = require(`${teoLibDir}/fileReader`);

describe("Testing Teo Client", () => {

    let client,
        appDir = process.cwd().replace( /\\/g, "/"),
        params = {
            homeDir : appDir,
            appDir  : appDir + "/apps/test",
            confDir : appDir + "/config",
            mode    : "test"
        },
        paramsStub = {
            "config": {
                "get": sinon.stub()
            }
        },
        server, req, res, matchRouteStub;

    before((done) => {

        matchRouteStub = sinon.stub(Client.routes, "matchRoute");
        matchRouteStub.returns({
            params: {
                testParam: true
            }
        });
        server = http.createServer((_req, _res) => {
            paramsStub.req = _req;
            paramsStub.res = _res;

            _res.end();
        }).listen(3210);

        paramsStub.config.get.withArgs("appDir").returns(params.appDir);

        server.once("listening", done);

    });

    beforeEach((done) => {

        http.get("http://localhost:3210", () => {
            client = new Client(paramsStub);
            done();
        });

    });

    afterEach(() => {

        client = null;

    });

    after((done) => {

        req = res = params = appDir = paramsStub = null;
        matchRouteStub.restore();
        server.close(done);

    });

    describe("Initialize", () => {

        it("Should create new client instance", () => {

            let _client = Client.Factory(paramsStub);
            assert.instanceOf(_client, Client);

        });

        it("Should create context", () => {

            assert.instanceOf(client.context, ClientContext);

        });

        it("Should apply route parameters", () => {

            assert.deepEqual(client.req.params, {testParam: true});

        });

        it("Should handle request error event fired by client.req", () => {

            let resSendStub = sinon.stub(client.res, "send", function() {});

            client.req.emit("error", 123, "Message");

            assert.isTrue(resSendStub.calledOnce);
            assert.deepEqual(resSendStub.args[0], [123, "Message"]);

            resSendStub.restore();

        });

        it("Shouldn't match route not existing route", () => {

            assert.isTrue(client.hasOwnProperty("route"));
            assert.isTrue(client.route.params.testParam);

        });

        it("Should have extension property", () => {

            assert.isTrue(client.hasOwnProperty("extension"));
            assert.equal(client.extension, "");

        });

    });

    describe("Getters", () => {

        it("Should return req object", () => {

            let req = client.req;

            assert.isObject(req);
            assert.instanceOf(req, http.IncomingMessage);

        });

        it("Should return parsed url", () => {

            let url = client.parsedUrl;

            assert.isObject(url);
            assert.equal(url.path, "/");

        });

        it("Should return pathname", () => {

            let pathname = client.pathname;

            assert.isString(pathname);
            assert.equal(pathname, "/");

        });

        it("Should return content type", () => {

            let contentType = client.contentType;

            assert.equal(contentType, client.req.contentType);

        });

        it("Should return res object", () => {

            let res = client.res;

            assert.isObject(res);
            assert.instanceOf(res, http.ServerResponse);

        });

    });

    describe("Dispatcher", () => {

        let isGeneratorStub, resSendStub;

        beforeEach(() => {

            isGeneratorStub = sinon.stub(_, "isGenerator");
            isGeneratorStub.returns(true);

            resSendStub = sinon.stub(client.res, "send", function() {});

        });

        afterEach(() => {

            isGeneratorStub.restore();
            resSendStub.restore();

        });

        it("Should process request", async(function* () {

            let dispatchStub = sinon.stub(client, "dispatch", function* () {});

            yield* client.process();

            assert.isTrue(dispatchStub.calledOnce);

            dispatchStub.restore();

        }));

        it("Should throw an error if route handler is not generator function", async(function* () {

            client.route = {
                handler: function() {}
            };
            isGeneratorStub.returns(false);

            try {
                yield* client.dispatch();
            } catch(e) {
                assert.equal(e.message, "Route handler should be a generator function!")
            }

        }));

        it("Should handle request", async(function* () {

            client.route = {
                handler: function* () {}
            };

            let handlerStub = sinon.stub(client.route, "handler", function* (req, res, next) {
                return "123";
            });

            yield* client.dispatch();

            assert.isTrue(handlerStub.calledOnce);
            assert.equal(handlerStub.args[0].length, 3);
            assert.instanceOf(handlerStub.args[0][0], http.IncomingMessage);
            assert.instanceOf(handlerStub.args[0][1], http.ServerResponse);
            assert.instanceOf(handlerStub.args[0][2], composition.Wrap);

            assert.isTrue(resSendStub.calledOnce);
            assert.equal(resSendStub.args[0][0], "123");

            handlerStub.restore();

        }));

        it("Should send 500 response if error was thrown inside handler", async(function* () {

            client.route = {
                handler: function* () {}
            };

            let handlerStub = sinon.stub(client.route, "handler", function* (req, res, next) {
                throw new Error("My error");
            });

            yield* client.dispatch();

            assert.isTrue(resSendStub.calledOnce);
            assert.equal(resSendStub.args[0][0], 500);

            handlerStub.restore();

        }));

        it("Should stream if range header exisits", async(function* () {

            client.req.headers.range = true;

            let streamStub = sinon.stub(streamer, "stream", function() {}),
                mimeLookup = sinon.stub(mime, "lookup");

            yield* client.dispatch();

            assert.isTrue(streamStub.calledOnce);
            assert.isTrue(mimeLookup.calledOnce);

            assert.equal(mimeLookup.args[0][0], "html");
            assert.deepEqual(streamStub.args[0], [client.req, client.res, `${params.appDir}/`, undefined]);

            delete client.req.headers.range;

            streamStub.restore();
            mimeLookup.restore();

        }));

        it("Should try to read file if no route and range header", async(function* () {

            let readFileSafely = sinon.stub(client, "readFileSafely", function() {});

            yield* client.dispatch();

            assert.isTrue(readFileSafely.calledOnce);
            assert.equal(readFileSafely.args[0][0], "/public/");

            readFileSafely.restore();

        }));

        it("Should read file safely and response content", () => {

            let fileReaderStub = sinon.stub(fileReader, "readFileSafely", function(path, callback) {
                callback(null, "123");
            });

            client.readFileSafely("/path");

            process.nextTick(() => {

                assert.isTrue(fileReaderStub.calledOnce);
                assert.isTrue(resSendStub.calledOnce);
                assert.equal(resSendStub.args[0][0], "123");

                fileReaderStub.restore();

            })

        });

        it("Should read file safely and response an error", () => {

            let fileReaderStub = sinon.stub(fileReader, "readFileSafely", function(path, callback) {
                callback("Error", "123");
            });

            client.readFileSafely("/path");

            process.nextTick(() => {

                assert.isTrue(fileReaderStub.calledOnce);
                assert.isTrue(resSendStub.calledOnce);
                assert.equal(resSendStub.args[0][0], 404);

                fileReaderStub.restore();
            })

        });

    });


});