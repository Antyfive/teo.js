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
    Db = require(teoBase + "/db/teo.db"),
    _ = require(teoBase + "/teo.utils"),
    configLib = require(teoBase + "/../lib/config"),
    co = require("co"),
    fs = require("fs"),
    path = require("path"),
    // generator test case
    async = generator => done => co(generator).then(done, done);

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

        let initAppSpy, loadConfigSpy, initDbSpy, initExtensionsSpy;

        beforeEach((done) => {

            initAppSpy = sinon.spy(App.prototype, "initApp");
            loadConfigSpy = sinon.spy(App.prototype, "loadConfig");
            initDbSpy = sinon.spy(App.prototype, "initDb");
            initExtensionsSpy = sinon.spy(App.prototype, "_initExtensions");

            app = new App(params, done);

        });

        afterEach(() => {

            app = null;

            initAppSpy.restore();
            loadConfigSpy.restore();
            initDbSpy.restore();
            initExtensionsSpy.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(loadConfigSpy.calledOnce);
            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(initExtensionsSpy.calledOnce);

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

            assert.equal(app.config.get("port"), 3100, "Port should be equal to value defined in app's development config");

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

        describe("Start Stop", () => {

            let runExtensionsStub, connectDBStub;

            beforeEach(() => {

                runExtensionsStub = sinon.stub(app, "_runExtensions", function* () {});
                connectDBStub = sinon.stub(app, "connectDB", function* () {});

            });

            afterEach(() => {

                runExtensionsStub.restore();
                connectDBStub.restore();

            });

            it("Should start app", async(function* () {

                let initServerStub = sinon.stub(app, "initServer", function* () {});

                yield* app.start();

                assert.isTrue(initServerStub.calledOnce);

                initServerStub.restore();

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

        });


    });

});