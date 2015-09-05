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

        });
    });

});