/*!
 * Teo.js core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    Core = require(teoBase + "/teo.core"),
    App = require(teoBase + "/teo.app"),
    co = require("co"),
    // generator test case
    async = generator => done => co(generator).then(done, done);

describe("Testing Teo Core", function () {

    let core,
        dir = process.cwd().replace( /\\/g, '/'),
        params = {
            appsDir: dir + "/apps",
            confDir: dir + "/config",
            homeDir: dir,
            mode: "development"
        };

    describe("Initialize", () => {

        let bindProcessEventsSpy, createCoreAppSpy, loadAppsSpy, registerAppSpy;

        before(done => {

            bindProcessEventsSpy = sinon.spy(Core.prototype, "_bindProcessEvents");
            createCoreAppSpy = sinon.spy(Core.prototype, "_createCoreApp");
            loadAppsSpy = sinon.spy(Core.prototype, "loadApps");
            registerAppSpy = sinon.spy(Core.prototype, "registerApp");

            core = new Core(params, done);

        });

        after(() => {

            core = null;
            bindProcessEventsSpy.restore();
            createCoreAppSpy.restore();
            loadAppsSpy.restore();
            registerAppSpy.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(bindProcessEventsSpy.calledOnce);

        });

        it("Should create core app", () => {

            assert.isTrue(createCoreAppSpy.calledOnce);
            assert.instanceOf(core.app, App);

        });

        it("Should load apps", () => {

            assert.isTrue(loadAppsSpy.calledOnce);

            assert.isTrue(registerAppSpy.calledOnce);

            assert.equal(registerAppSpy.args[0][0], "test", "App's name should be passed");
            assert.deepEqual(Object.keys(core.apps), ["test"]);
            assert.instanceOf(core.apps.test, App);

        });

    });

    describe("Apps registration", () => {

        before(done => {

            core = new Core(params, done);

        });

        after(() => {

            core = null;

        });

        it("Should register new app", async(function* () {

            var createAppSpy = sinon.spy(core, "_createApp");

            delete core.apps.test;

            yield core.registerApp("test");

            assert.isTrue(createAppSpy.calledOnce, "Create app private method should be called once");
            assert.deepEqual(createAppSpy.args[0][0], {
                appDir: dir + "/apps/test",
                confDir: dir + "/apps/test/config",
                homeDir: dir,
                name: "test",
                mode: "development",
                coreConfig: core.coreAppConfig
            }, "Passed config should be correct");

            assert.equal(Object.keys(core.apps).length, 1, "Apps should be loaded");
            assert.instanceOf(core.apps.test, App);
            assert.equal(core.apps.test.name, 'test', "App should have name");

            createAppSpy.restore();

        }));

    });

    describe("App life cycle", () => {

        let lifeCircleActionSpy;

        before(done => {

            core = new Core(params, done);

            lifeCircleActionSpy = sinon.spy(core, "_lifeCircleAction");

        });

        after(() => {

            core = null;

        });

        afterEach(() => {

            lifeCircleActionSpy.reset();

        });

        it("Should start single app with passed name", async(function* () {

            let appStartStub = sinon.stub(core.apps.test, "start", function* () {});

            yield core.start("test");

            assert.isTrue(appStartStub.calledOnce);
            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], ["test", "start"]);

            appStartStub.restore();

        }));

        it("Should start all apps without passed name", async(function* () {

            let appStartStub = sinon.stub(core.apps.test, "start", function* () {});

            yield core.start();

            assert.isTrue(appStartStub.calledOnce);
            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], [undefined, "start"]);


            appStartStub.restore();

        }));

        it("Should start core app with other apps", async(function* () {

            let coreAppStartStub = sinon.stub(core.app, "start", function* (){});
            let appStartStub = sinon.stub(core.apps.test, "start", function* () {});
            core.coreAppConfig.coreAppEnabled = true;

            yield core.start();

            assert.isTrue(coreAppStartStub.calledOnce);
            assert.isTrue(appStartStub.calledOnce);


            coreAppStartStub.restore();
            appStartStub.restore();

            core.coreAppConfig.coreAppEnabled = false;

        }));

        it("Shouldn't start core app but other apps", async(function* () {

            let coreAppStartStub = sinon.stub(core.app, "start", function* (){});
            let appStartStub = sinon.stub(core.apps.test, "start", function* () {});

            yield core.start();

            assert.isFalse(coreAppStartStub.calledOnce);
            assert.isTrue(appStartStub.calledOnce);

            coreAppStartStub.restore();
            appStartStub.restore();

        }));


        it("Should stop single app with passed name", async(function* () {

            let appStopStub = sinon.stub(core.apps.test, "stop", function* () {});

            yield core.stop("test");

            assert.isTrue(appStopStub.calledOnce);

            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], ["test", "stop"]);

            appStopStub.restore();

        }));

        it("Should stop all apps without passed name", async(function* () {

            let appStopStub = sinon.stub(core.apps.test, "stop", function* () {});

            yield core.stop();

            assert.isTrue(appStopStub.calledOnce);
            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], [undefined, "stop"]);

            appStopStub.restore();

        }));

        it("Should stop core app with other apps", async(function* () {

            let coreAppStopStub = sinon.stub(core.app, "stop", function* (){});
            let appStopStub = sinon.stub(core.apps.test, "stop", function* () {});

            core.coreAppConfig.coreAppEnabled = true;

            yield core.stop();

            assert.isTrue(coreAppStopStub.calledOnce);
            assert.isTrue(appStopStub.calledOnce);

            coreAppStopStub.restore();
            appStopStub.restore();

            core.coreAppConfig.coreAppEnabled = false;

        }));

        it("Shouldn't stop core app but other apps", async(function* () {

            let coreAppStopStub = sinon.stub(core.app, "stop", function* (){});
            let appStopStub = sinon.stub(core.apps.test, "stop", function* () {});

            yield core.stop();

            assert.isFalse(coreAppStopStub.called);
            assert.isTrue(appStopStub.calledOnce);

            coreAppStopStub.restore();
            appStopStub.restore();

        }));



        it("Should restart single app with passed name", async(function* () {

            let appRestartStub = sinon.stub(core.apps.test, "restart", function* () {});

            yield core.restart("test");

            assert.isTrue(appRestartStub.calledOnce);

            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], ["test", "restart"]);

            appRestartStub.restore();

        }));

        it("Should restart all apps without passed name", async(function* () {

            let appRestartStub = sinon.stub(core.apps.test, "restart", function* () {});

            yield core.restart();

            assert.isTrue(appRestartStub.calledOnce);
            assert.isTrue(lifeCircleActionSpy.calledOnce);
            assert.deepEqual(lifeCircleActionSpy.args[0], [undefined, "restart"]);

            appRestartStub.restore();

        }));

        it("Should restart core app with other apps", async(function* () {

            let coreAppRestartStub = sinon.stub(core.app, "restart", function* (){});
            let appRestartStub = sinon.stub(core.apps.test, "restart", function* () {});

            core.coreAppConfig.coreAppEnabled = true;

            yield core.restart();

            assert.isTrue(coreAppRestartStub.calledOnce);
            assert.isTrue(appRestartStub.calledOnce);

            coreAppRestartStub.restore();
            appRestartStub.restore();

            core.coreAppConfig.coreAppEnabled = false;

        }));

        it("Shouldn't restart core app but other apps", async(function* () {

            let coreAppRestartStub = sinon.stub(core.app, "restart", function* (){});
            let appRestartStub = sinon.stub(core.apps.test, "restart", function* () {});

            yield core.restart();

            assert.isFalse(coreAppRestartStub.called);
            assert.isTrue(appRestartStub.calledOnce);

            coreAppRestartStub.restore();
            appRestartStub.restore();

        }));

    });
});