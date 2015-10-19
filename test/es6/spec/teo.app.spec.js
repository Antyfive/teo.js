/*!
 * Teo App spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 9/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

const
    App = require(teoBase + "/teo.app"),
    AppCache = require(teoBase + "/teo.app.cache"),
    Middleware = require(teoBase + "/teo.middleware"),
    Db = require(teoBase + "/db/teo.db"),
    _ = require(teoBase + "/teo.utils"),
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
            confDir : appDir + "/config",
            mode    : "test"
        };

    beforeEach((done) => {

        app = new App(params, done);

    });

    afterEach(() => {

        app = null;

    });

    describe("Initialization", () => {

        let initAppSpy, loadConfigSpy, collectExecutableFilesSpy, initDbSpy, initExtensionsSpy;

        beforeEach((done) => {

            initAppSpy = sinon.spy(App.prototype, "initApp");
            loadConfigSpy = sinon.spy(App.prototype, "loadConfig");
            collectExecutableFilesSpy = sinon.spy(App.prototype, "collectExecutableFiles");
            initDbSpy = sinon.spy(App.prototype, "initDb");
            initExtensionsSpy = sinon.spy(App.prototype, "_initExtensions");

            app = new App(params, done);

        });

        afterEach(() => {

            app = null;

            initAppSpy.restore();
            loadConfigSpy.restore();
            collectExecutableFilesSpy.restore();
            initDbSpy.restore();
            initExtensionsSpy.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(loadConfigSpy.calledOnce);
            assert.isTrue(collectExecutableFilesSpy.calledOnce);
            assert.isTrue(initAppSpy.calledOnce);
            assert.isTrue(initExtensionsSpy.calledOnce);

        });

        it("Should load config", async(function* () {

            let readdirStub = sinon.stub(fs, "readdir", function(args, cb) {
                return cb(null, ["test.js"]);
            });

            let getScriptStub = sinon.stub(app, "_getScript", function() {
                return {test: "123"};
            });

            let applyConfigStub = sinon.stub(app, "_applyConfig", function() {});

            yield app.loadConfig();

            assert.isTrue(readdirStub.calledOnce);
            assert.isTrue(getScriptStub.calledOnce);
            assert.equal(getScriptStub.args[0][0],  path.join(app.config.confDir, "test.js"), "Script path should be correct");
            assert.isTrue(applyConfigStub.calledOnce);
            assert.deepEqual(applyConfigStub.args[0][0], {test: "123"}, "Correct config should be applied");

            readdirStub.restore();
            getScriptStub.restore();
            applyConfigStub.restore();

        }));

        it("Should collect executable files", async(function* () {

            let readAppDirsStub = sinon.stub(app, "_readAppDirs", function* () {});
            let readAppFilesStub = sinon.stub(app, "_readAppFiles", function* () {});

            yield app.collectExecutableFiles();

            assert.isTrue(readAppDirsStub.calledOnce);
            assert.isTrue(readAppFilesStub.calledOnce);

            readAppDirsStub.restore();
            readAppFilesStub.restore();

        }));

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

        it("Should get script from cache", () => {

            let cacheStub = sinon.stub(app.cache, "get");

            cacheStub.withArgs("myFilePath").returns({test: true});

            let file = app._getScript("myFilePath");

            assert.isTrue(cacheStub.calledOnce);
            assert.equal(cacheStub.args[0][0], "myFilePath");
            assert.deepEqual(file, {test: true});

            cacheStub.restore();

        });

        it("Should load script if no in cache", () => {

            assert.throws(app._getScript.bind(app, "myFilePath"), "Cannot find module 'myFilePath'");

        });

        it("Should read app's directories", async(function* () {

            configGetStub.withArgs("appDirs").returns([
                "first",
                "second"
            ]);

            let collectAppDirFilesStub = sinon.stub(app, "__collectAppDirFiles", function* () {});

            yield app._readAppDirs();

            assert.isTrue(collectAppDirFilesStub.calledTwice);
            assert.deepEqual(collectAppDirFilesStub.args, [
                [path.join(app.config.appDir, "first")], [path.join(app.config.appDir, "second")]
            ]);

            collectAppDirFilesStub.restore();

        }));

        it("Should collect files inside directory", async(function* () {

            let readdirStub = sinon.stub(fs, "readdir", function(args, cb) {
                cb(null, ["one.js", "two.js"]);
            });

            let loadFileStub = sinon.stub(app, "__loadFile", function* () {});

            yield app.__collectAppDirFiles("test");

            assert.isTrue(readdirStub.calledOnce);
            assert.equal(readdirStub.args[0][0], "test");
            assert.isTrue(loadFileStub.calledTwice);
            assert.deepEqual(loadFileStub.args, [
                ["test/one.js"], ["test/two.js"]
            ]);

            readdirStub.restore();
            loadFileStub.restore();

        }));

        it("Should load single file", async(function* () {

            let lstatStub = sinon.stub(fs, "lstat", function(args, cb) {
                cb(null, {
                    isFile: function() {return true}
                })
            });

            let getScriptStub = sinon.stub(app, "_getScript",  function() {
                return "script";
            });

            let cacheAddSpy = sinon.stub(app.cache, "add");

            yield app.__loadFile("/mypath");

            assert.isTrue(lstatStub.calledOnce);
            assert.equal(lstatStub.args[0][0], "/mypath");

            assert.isTrue(getScriptStub.calledOnce);

            assert.isTrue(cacheAddSpy.calledOnce);
            assert.deepEqual(cacheAddSpy.args[0], ["/mypath", "script"]);

            lstatStub.restore();
            getScriptStub.restore();
            cacheAddSpy.restore();

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

            let loadFileStub = sinon.stub(app, "__loadFile", function* () {});

            yield app._readAppFiles();

            assert.isTrue(loadFileStub.calledTwice);
            assert.deepEqual(loadFileStub.args, [
                [path.join(app.config.appDir, "first.js")], [path.join(app.config.appDir, "second.js")]
            ]);

            loadFileStub.restore();
        }));

    });

    describe("Config", () => {
        let config;

        beforeEach(() => {
            config = {myConfig: true};
            app.config = {
                appConfig: "123",
                coreConfig: {
                    coreParam: "1"
                },
                mode: "test",
                test: { // test mode
                    key: "testmode"
                },
                key2: "hi"
            };

            app._applyConfig(config);
        });

        it("Should apply config object", () => {

            assert.deepEqual(_.omit(app.config, "get"), {
                coreParam: "1",
                appConfig: "123",
                myConfig: true,
                mode: "test",
                test: {
                    key: "testmode"
                },
                key2: "hi"
            });

            assert.isFunction(app.config.get, "Config getter should be applied");

        });

        it("Should get parameter by key", () => {

            assert.equal(app.config.get("key"), "testmode", "Should get key from run mode property");
            assert.equal(app.config.get("key2"), "hi", "Should get key from non-mode properties");

        });

    });

    describe("Life circle", () => {

        describe("Start", () => {

            let runExtensionsStub,runAppScriptsStub, connectOrmStub; //initServerStub;

            beforeEach(() => {

                runExtensionsStub = sinon.stub(app, "_runExtensions", function* () {});
                runAppScriptsStub = sinon.stub(app, "_runAppScripts", function* () {});
                connectOrmStub = sinon.stub(app, "_connectOrm", function* () {});
                //initServerStub = sinon.stub(app, "initServer", function() {});

            });

            afterEach(() => {

                runExtensionsStub.restore();
                runAppScriptsStub.restore();
                connectOrmStub.restore();
                //initServerStub.restore();

            });

            it("Should start app", async(function* () {

                let initServerSpy = sinon.spy(app, "initServer");

                yield app.start();

                assert.isTrue(initServerSpy.calledOnce);

                initServerSpy.restore();

            }));
        });


    });

});