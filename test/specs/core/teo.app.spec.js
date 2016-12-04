/*!
 * Teo App spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 9/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    App = require(teoBase + "/teo.app"),
    Middleware = require(teoBase + "/teo.middleware"),
    Client = require(teoBase + "/teo.client"),
    Extensions = require(teoBase + "/teo.app.extensions"),
    Db = require("teo-db"),
    _ = require(teoBase + "/../lib/utils"),
    configLib = require(teoBase + "/../lib/config"),
    serverProvider = require(teoBase + "/teo.server.provider"),
    co = require("co"),
    fs = require("fs"),
    path = require("path"),
    // generator test case
    async = generator => done => co(generator).then(done, done),
    http = require("http"),
    https = require("https");

describe("Testing Teo App", () => {

    let app,
        appDir = process.cwd().replace( /\\/g, "/"),
        params = {
            homeDir : appDir,
            appDir  : appDir + "/apps/test",
            confDir : appDir + "/apps/test/config",
            mode    : "test"
        };

    beforeEach((done) => {

        app = new App(params, done);

    });

    afterEach(() => {

        app = null;

    });

    describe("Initialization", () => {

        let initAppSpy, loadConfigSpy, initDbSpy, initExtensionsSpy, initServerSpy;

        beforeEach((done) => {

            initAppSpy = sinon.spy(App.prototype, "initApp");
            loadConfigSpy = sinon.spy(App.prototype, "loadConfig");
            initDbSpy = sinon.spy(App.prototype, "initDb");
            initExtensionsSpy = sinon.spy(App.prototype, "_initExtensions");
            initServerSpy = sinon.spy(App.prototype, "initServer");

            app = new App(params, done);

        });

        afterEach(() => {

            app = null;

            initAppSpy.restore();
            loadConfigSpy.restore();
            initDbSpy.restore();
            initExtensionsSpy.restore();
            initServerSpy.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(loadConfigSpy.calledOnce);
            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(initExtensionsSpy.calledOnce);
            assert.isTrue(initServerSpy.calledOnce);

        });

    });

    describe("Init DB", () => {

        let configStub;

        beforeEach(() => {

            configStub = sinon.stub(app.config, "get");

        });

        afterEach(() => {

            configStub.restore();

        });

        it("Should init DB", () => {

            configStub.withArgs("db").returns({
                enabled: true
            });

            try {
                app.initDb();
            } catch(e) {

            }

            assert.isTrue(configStub.calledTwice);

        });

        it("Shouldn't init DB", () => {

            configStub.reset();

            configStub.withArgs("db").returns({
                enabled: false
            });

            app.initDb();

            assert.isTrue(configStub.calledOnce);

        });

    });

    describe("Init server", () => {

        let createServerSpy, httpCreateServerSpy, getDispatcherSpy;

        beforeEach(() => {

            createServerSpy = sinon.spy(app, "createServer");
            httpCreateServerSpy = sinon.spy(http, "createServer");
            getDispatcherSpy = sinon.spy(app, "getDispatcher");

        });

        afterEach(() => {

            createServerSpy.restore();
            httpCreateServerSpy.restore();
            getDispatcherSpy.restore();

        });

        it("Should init server", async(function* () {

            yield* app.initServer();

            assert.isTrue(createServerSpy.calledOnce, "Should call .createServer once");
            assert.isTrue(httpCreateServerSpy.calledOnce);
            assert.isTrue(getDispatcherSpy.calledOnce, "Dispatcher getter should be called");

            assert.isObject(app.server, "Should be an object");
            assert.instanceOf(app.server, http.Server, "Should be an instanceof http.Server");

        }));

        describe("Error throwing in create server", () => {

            let configStub;

            beforeEach(() => {

                configStub = sinon.stub(app.config, "get");

            });

            afterEach(() => {

                configStub.restore();

            });

            it("Should throw an error if no protocol", async(function* () {

                configStub.withArgs("server").returns({
                    protocol: undefined
                });

                try {
                    yield* app.createServer();
                } catch(e) {
                    assert.equal(e.message, "Protocol is not set in the server config");
                }

            }));

            it("Should throw an error if no host", async(function* () {

                configStub.withArgs("server").returns({
                    protocol: "smth",
                    host: undefined
                });

                try {
                    yield* app.createServer();
                } catch(e) {
                    assert.equal(e.message, "Host is not set in the server config");
                }

            }));

            it("Should throw an error if no port", async(function* () {

                configStub.withArgs("server").returns({
                    protocol: "http",
                    host: 'localhost',
                    port: undefined
                });

                try {
                    yield* app.createServer();
                } catch(e) {
                    assert.equal(e.message, "Port is not set in the server config");
                }

            }));

        });

    });

    describe("App sources loading", () => {

        let configGetStub;

        beforeEach(() => {

            configGetStub = sinon.stub(app.config, "get");

        });

        afterEach(() => {

            configGetStub.restore();

        });

        it("Should load script if no in cache", () => {

            assert.throws(app._getScript.bind(app, "myFilePath"), "Cannot find module 'myFilePath'");

        });

        it("Should load single file", async(function* () {

            let lstatStub = sinon.stub(fs, "lstat", function(args, cb) {
                cb(null, {
                    isFile: function() {return true}
                })
            });

            let getScriptStub = sinon.stub(app, "_getScript",  function() {
                return "script";
            });

            yield app.__loadFile("/mypath");

            assert.isTrue(lstatStub.calledOnce);
            assert.equal(lstatStub.args[0][0], "/mypath");

            assert.isTrue(getScriptStub.calledOnce);

            lstatStub.restore();
            getScriptStub.restore();

        }));

        it("Should throw error if not a file was loaded", async(function* () {

            let lstatStub = sinon.stub(fs, "lstat", function(args, cb) {
                cb(null, {
                    isFile: function() {return false}
                })
            });

            try {
                yield app.__loadFile("/mypath");
            } catch(e) {
                assert.equal(e.message, "Not a file was found!");
            }

            lstatStub.restore();

        }));

        it("Should read app special files", async(function* () {

            configGetStub.withArgs("appFiles").returns([
                "first.js",
                "second.js"
            ]);

            configGetStub.withArgs("appDir").returns(params.appDir);

            let loadFileStub = sinon.stub(app, "__loadFile", function* () {});

            yield app._readAppFiles();

            assert.isTrue(loadFileStub.calledTwice);
            assert.deepEqual(loadFileStub.args, [
                [path.join(params.appDir, "first.js")], [path.join(params.appDir, "second.js")]
            ]);

            loadFileStub.restore();
        }));

    });

    describe("Config", () => {
        let config;

        beforeEach(() => {

            app.initialConfig.myKey = 123;

        });

        afterEach(() => {

            delete app.initialConfig.myKey;

        });

        it("Should load config", () => {

            let loadConfigSpy = sinon.spy(configLib, "loadConfig");

            app.loadConfig();

            assert.isTrue(loadConfigSpy.calledOnce);
            assert.equal(loadConfigSpy.args[0][0], params.confDir, "Path to config directory should be passed");

            loadConfigSpy.restore();

        });

        it("Should have getter function", () => {

            assert.isFunction(app.config.get, "Getter should be a function");

        });

        it("Should return parameter by key", () => {

            assert.equal(app.config.get("server").port, 3100, "Port should be equal to value defined in app's development config");

        });

        it("Should check on get initial config first", () => {

            assert.equal(app.config.get("myKey"), 123);

        });

        it("Should check app's config if no such key in initial config", () => {

            let hasSpy = sinon.spy(app.config, "has");

            // 1) get from initial config ---- ---- ----

            assert.equal(app.config.get("myKey"), 123);

            delete app.initialConfig.myKey;

            // 2) get from app's config ---- ---- ----

            assert.isUndefined(app.config.get("myKey"));

            assert.isTrue(hasSpy.calledOnce);

            // 3) get from core config ---- ---- ----

            let coreConfigGetStub = sinon.stub();
            let coreConfigHasStub = sinon.stub();

            app.initialConfig.coreConfig = {
                get: coreConfigGetStub,
                has: coreConfigHasStub
            };

            coreConfigGetStub.returns("myVal");
            coreConfigHasStub.returns(true);

            assert.equal(app.config.get("myKey"), "myVal");

            assert.isTrue(hasSpy.calledTwice);

            assert.isTrue(coreConfigHasStub.calledOnce);
            assert.isTrue(coreConfigGetStub.calledOnce);

            hasSpy.restore();
            delete app.initialConfig.coreConfig;

        });

    });

    describe("Life circle", () => {

        beforeEach(() => {

            app.appClientRouter = Client.router();

        });

        afterEach(() => {

            app.appClientRouter = null;

        });

        describe("Start Stop", () => {

            let runExtensionsStub, connectDBStub, httpListenStub, httpCloseStub;

            beforeEach(() => {

                runExtensionsStub = sinon.stub(app, "runExtensions", function* () {});
                connectDBStub = sinon.stub(app, "connectDB", function* () {});
                httpListenStub = sinon.stub(http.Server.prototype, "listen", (port, host, callback) => {
                    callback();
                });
                httpCloseStub = sinon.stub(http.Server.prototype, "close", (callback) => {
                    callback();
                });

            });

            afterEach(() => {

                runExtensionsStub.restore();
                connectDBStub.restore();
                httpListenStub.restore();
                httpCloseStub.restore();

            });

            it("Should start app", async(function* () {

                let listenServerStub = sinon.stub(app, "listenServer", function* () {});

                yield* app.start();

                assert.isTrue(listenServerStub.calledOnce);
                assert.isTrue(runExtensionsStub.calledOnce);

                listenServerStub.restore();

            }));

            it("Should run extensions", async(function* () {

                runExtensionsStub.restore();

                let runAllStub = sinon.stub(app.extensions, "runAll", function* () {});

                yield* app.runExtensions();

                assert.isTrue(runAllStub.called);
                assert.equal(runAllStub.args[0][0], app, "App context should be passed");

                runAllStub.restore();

            }));

            it("Should stop app", async(function* () {

                let closeServerStub = sinon.stub(app, "closeServer", function* () {});
                let disconnectDBStub = sinon.stub(app, "disconnectDB", function* () {});

                yield* app.stop();

                assert.isTrue(closeServerStub.calledOnce);
                assert.isTrue(disconnectDBStub.calledOnce);

                closeServerStub.restore();
                disconnectDBStub.restore();

            }));

            it("Should restart app", async(function* () {

                let closeServerStub = sinon.stub(app, "closeServer", function* () {});
                let disconnectDBStub = sinon.stub(app, "disconnectDB", function* () {});
                let startStub = sinon.stub(app, "start", function* () {});

                yield* app.restart();

                assert.isTrue(closeServerStub.calledOnce);
                assert.isTrue(disconnectDBStub.calledOnce);
                assert.isTrue(startStub.calledOnce);

                closeServerStub.restore();
                disconnectDBStub.restore();
                startStub.restore();

            }));

            it("Should listen server", async(function* () {

                yield* app.listenServer();

                assert.equal(httpListenStub.args[0][0], "3100", "Post should be correct");
                assert.equal(httpListenStub.args[0][1], "localhost", "Host should be correct");
                assert.isFunction(httpListenStub.args[0][2], "Callback for yieldable function should be passed");

            }));

            it("Should close listening server", async(function* () {

                yield* app.listenServer();

                assert.isFalse(httpCloseStub.called, "Close method should not be closed");

                yield* app.closeServer();

                assert.isTrue(httpCloseStub.calledOnce);


            }));

            describe("Module mounter arguments getter", () => {

                let canUseDbStub;

                beforeEach(() => {

                    canUseDbStub = sinon.stub(app, "canUseDb");

                    app.db = {
                        instance: "test"
                    };

                });

                afterEach(() => {

                    canUseDbStub.restore();
                    app.db = null;

                });

                it("Should return mixed arguments for module mounter with db instance", () => {

                    canUseDbStub.returns(true);

                    let args = app.mixinModuleMounterContextArguments("my router");

                    assert.isArray(args, "Arguments array should be returned");
                    assert.equal(args.length, 2, "Should be two arguments in the array");

                    assert.equal(args[0], "my router", "Client.router API should be the first argument");
                    assert.equal(args[1], "test", "app.db.instance object should be the second argument");

                });

                it("Should return arguments for module mounter without db enabled", () => {

                    canUseDbStub.returns(false);

                    let args = app.mixinModuleMounterContextArguments("my router");

                    assert.isArray(args, "Arguments array should be returned");
                    assert.equal(args.length, 1, "Should be only one argument in the array");

                    assert.equal(args[0], "my router", "Client.router API should be the first argument");

                });

            });

        });

        describe("Initial Req Dispatch", () => {

            let dispatcher, createClientContextSpy, middlewareRunSpy, server, req, res, respondSpy,
                clientProcessSpy;

            beforeEach(async(function* () {

                createClientContextSpy = sinon.spy(app, "createClientContext");
                middlewareRunSpy = sinon.spy(Middleware.prototype, "run");
                respondSpy = sinon.spy(app, "respond");
                clientProcessSpy = sinon.spy(Client.prototype, "process");

                dispatcher = app.getDispatcher();

                server = http.createServer((_req, _res) => {
                    req = _req;
                    res = _res;

                    res.end();
                }).listen(3210);

                yield function(callback) {
                    server.once("listening", () => {
                        http.get("http://localhost:3210", () => {
                            callback();
                        });
                    });
                };

            }));

            afterEach(async(function* () {

                assert.isTrue(clientProcessSpy.calledOnce);

                dispatcher = null;
                createClientContextSpy.restore();
                middlewareRunSpy.restore();
                respondSpy.restore();
                clientProcessSpy.restore();

                req = null;
                res = null;

                yield function(callback) {
                    server.close(callback);
                };


            }));

            it("Should dispatch request", () => {

                // emulate dispatching of the request
                dispatcher(req, res);

                assert.isTrue(createClientContextSpy.calledOnce);
                assert.isTrue(middlewareRunSpy.calledOnce);
                assert.isTrue(respondSpy.calledOnce);

            });

        });

        describe.skip("Db life circle", () => { // TODO: refactor

            let connectDbStub, canUseDbStub, connectedDbStub, disconnectDbStub;

            beforeEach(() => {

                connectDbStub = sinon.stub(app.db, "connect", function* () {});
                canUseDbStub = sinon.stub(app, "canUseDb");
                connectedDbStub = sinon.stub(app.db, "connected");
                disconnectDbStub = sinon.stub(app.db, "disconnect", function* () {});

            });

            afterEach(() => {

                connectDbStub.restore();
                canUseDbStub.restore();
                connectedDbStub.restore();
                disconnectDbStub.restore();

            });

            it("Should connect DB", async(function* () {

                canUseDbStub.returns(true);

                yield* app.connectDB();

                assert.isTrue(connectDbStub.calledOnce);

            }));

            it("Shouldn't connect DB if connect isn't allowed", async(function* () {

                canUseDbStub.returns(false);

                yield* app.connectDB();

                assert.isFalse(connectDbStub.called);

            }));

            it("Should disconnect DB if it's allowed to use it and it's connected", async(function* () {

                canUseDbStub.returns(true);
                connectedDbStub.returns(true);

                yield* app.disconnectDB();

                assert.isTrue(disconnectDbStub.calledOnce);

            }));

        });


    });

    describe("Create Server", () => {

        let configGetStub, getServerStub, serverStub, readFileStub;

        beforeEach(() => {

            configGetStub = sinon.stub(app.config, "get");
            getServerStub = sinon.stub(serverProvider, "getServer");
            serverStub = {
                createServer: sinon.stub()
            };
            getServerStub.returns(serverStub);
            readFileStub = sinon.stub(fs, "readFile", (file, cb) => {
                if (file === "appDir/keyPath") {
                    cb(null, "keyFileContent");
                }
                if (file === "appDir/certPath") {
                    cb(null, "certFileContent");
                }
            });

        });

        afterEach(() => {

            configGetStub.restore();
            serverStub = null;
            getServerStub.restore();
            readFileStub.restore();

        });


        it("Should throw an error if protocol is HTTPS and no server.keyPath set in config", async(function* () {

            const dispatcher = sinon.stub();
            let errorCaught = false;
            configGetStub.withArgs("server").returns({
                certPath: "certPath",
                protocol: "https",
                host: "localhost",
                port: 3000
            });

            try {
                yield* app.createServer(dispatcher);
            } catch(e) {
                errorCaught = true;
                assert.equal(e.message, "Not all required config properties are available. Key path: undefined; Certificate path: certPath");
            }

            assert.isTrue(errorCaught);
            assert.isTrue(configGetStub.calledOnce, "Should call config.get once");
            assert.isFalse(readFileStub.called, "Shouldn't call fs.readFile");

            assert.isFalse(serverStub.createServer.called, "Shouldn't call .createServer once");

        }));

        it("Should throw an error if protocol is HTTPS and no server.certPath set in config", async(function* () {

            const dispatcher = sinon.stub();
            let errorCaught = false;
            configGetStub.withArgs("server").returns({
                keyPath: "keyPath",
                protocol: "https",
                host: "localhost",
                port: 3000
            });

            try {
                yield* app.createServer(dispatcher);
            } catch(e) {
                errorCaught = true;
                assert.equal(e.message,
                    "Not all required config properties are available. Key path: keyPath; Certificate path: undefined"
                );
            }

            assert.isTrue(errorCaught);
            assert.isTrue(configGetStub.calledOnce, "Should call config.get once");
            assert.isFalse(readFileStub.called, "Shouldn't call fs.readFile");

            assert.isFalse(serverStub.createServer.called, "Shouldn't call .createServer once");

        }));

        it("Should create HTTP server", async(function* () {

            const dispatcher = sinon.stub();
            configGetStub.withArgs("server").returns({
                protocol: "http",
                host: "localhost",
                port: 3000
            });

            yield* app.createServer(dispatcher);

            assert.isTrue(configGetStub.calledOnce, "Should call config.get once");
            assert.isTrue(getServerStub.calledOnce, "Should call server provider");
            assert.isTrue(serverStub.createServer.calledOnce, "Should call [server].createServer");
            assert.isFunction(serverStub.createServer.args[0][0], "Should pass a stub a second argument");

        }));

        it("Should create HTTPS server", async(function* () {

            const dispatcher = sinon.stub();
            configGetStub.withArgs("server").returns({
                keyPath: "keyPath",
                certPath: "certPath",
                protocol: "https",
                host: "localhost",
                port: 3000
            });
            configGetStub.withArgs("appDir").returns("appDir");

            yield* app.createServer(dispatcher);

            assert.isTrue(configGetStub.calledTwice, "Should call config.get twice");
            assert.isTrue(readFileStub.calledTwice, "Should call twice fs.readFile");
            assert.equal(readFileStub.args[0][0], "appDir/keyPath", "Path to key file should be correct");
            assert.equal(readFileStub.args[1][0], "appDir/certPath", "Path to cert should be correct");

            assert.isTrue(serverStub.createServer.calledOnce, "Should call .createServer once");
            assert.deepEqual(serverStub.createServer.args[0][0], {key: "keyFileContent", cert: "certFileContent"});
            assert.isFunction(serverStub.createServer.args[0][1], "Should pass a stub a second argument");

        }));

        it("Should create HTTP server by default", async(function* () {

            const dispatcher = sinon.stub();
            configGetStub.withArgs("server").returns({
                protocol: "http",
                host: "localhost",
                port: 3000
            });

            yield* app.createServer(dispatcher);

            assert.isTrue(configGetStub.calledOnce, "Should call config.get once");
            assert.isTrue(getServerStub.calledOnce, "Should call server provider");
            assert.isTrue(serverStub.createServer.calledOnce, "Should call [server].createServer");
            assert.isFunction(serverStub.createServer.args[0][0], "Should pass a stub a second argument");

        }));

        it("Should create HTTP server by default", async(function* () {

            const dispatcher = sinon.stub();
            configGetStub.withArgs("server").returns({
                protocol: "smth",
                host: "localhost",
                port: 3000
            });

            yield* app.createServer(dispatcher);

            assert.isTrue(configGetStub.calledOnce, "Should call config.get once");
            assert.isTrue(getServerStub.calledOnce, "Should call server provider");
            assert.isTrue(serverStub.createServer.calledOnce, "Should call [server].createServer");
            assert.isFunction(serverStub.createServer.args[0][0], "Should pass a stub a second argument");

        }));

    });

});