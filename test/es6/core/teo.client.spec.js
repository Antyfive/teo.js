/*!
 * Teo.js client spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/8/15
 */

/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    http = require("http"),
    Client = require(`${teoBase}/teo.client`),
    ClientContext = require(`${teoBase}/teo.client.context`);

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
        server, req, res;

    before((done) => {

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

        it("Should handle request error event fired by client.req", () => {

            let resSendStub = sinon.stub(client.res, "send", function() {});

            client.req.emit("error", 123, "Message");

            assert.isTrue(resSendStub.calledOnce);
            assert.deepEqual(resSendStub.args[0], [123, "Message"]);

            resSendStub.restore();

        });

        it("Shouldn't match route not existing route", () => {

            assert.isTrue(client.hasOwnProperty("route"));
            assert.isUndefined(client.route);

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

            try {
                yield* client.dispatch()
            } catch(e) {
                assert.equal(e.message, "Route handler should be a generator function!")
            }

        }));

    });


});