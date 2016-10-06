/*!
 * Teo.js core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    events = require("events"),
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

        let bindProcessEventsSpy, createCoreAppSpy, loadAppsSpy, registerAppSpy, setupWorkersLoggingStub;

        before(async(function* () {

            bindProcessEventsSpy = sinon.spy(Core.prototype, "bindProcessEvents");
            createCoreAppSpy = sinon.spy(Core.prototype, "_createCoreApp");
            loadAppsSpy = sinon.spy(Core.prototype, "loadApps");
            registerAppSpy = sinon.spy(Core.prototype, "registerApp");
            setupWorkersLoggingStub = sinon.spy(Core.prototype, "_setupWorkersLogging");

            core = new Core(params);

            yield* core.initializeApps();

        }));

        after(() => {

            core = null;
            bindProcessEventsSpy.restore();
            createCoreAppSpy.restore();
            loadAppsSpy.restore();
            registerAppSpy.restore();
            setupWorkersLoggingStub.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(bindProcessEventsSpy.calledOnce);

        });

        it("Should create core app", () => {

            assert.isTrue(createCoreAppSpy.calledOnce);
            assert.instanceOf(core.app, App);
            assert.isFalse(setupWorkersLoggingStub.called, "Shouldn't call _setupWorkersLogging by default");

        });

        it("Should load apps", () => {

            assert.isTrue(loadAppsSpy.calledOnce);

            assert.isTrue(registerAppSpy.calledOnce);

            assert.equal(registerAppSpy.args[0][0], "test", "App's name should be passed");
            assert.deepEqual(Object.keys(core.apps), ["test"]);
            assert.instanceOf(core.apps.test, App);

        });

        it("Should setup workers logging if cluster is enabled", async(function* () {

            let _createAppStub = sinon.stub(core, "_createApp", function* () {
                return {
                    config: {
                        get: getStub
                    }
                }
            });

            let getStub = sinon.stub();

            getStub.withArgs("cluster").returns({enabled: true});

            yield* core._createCoreApp();

            assert.isTrue(setupWorkersLoggingStub.calledOnce, "Should be called once if cluster is enabled");

            _createAppStub.restore();

        }));

    });

    describe("Apps registration", () => {

        before(async(function* () {

            core = new Core(params);
            yield* core.initializeApps();

        }));

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
                appName: "test",
                mode: "development",
                coreConfig: core.app.config
            }, "Passed config should be correct");

            assert.equal(Object.keys(core.apps).length, 1, "Apps should be loaded");
            assert.instanceOf(core.apps.test, App);
            assert.equal(core.apps.test.appName, "test", "App should have name");

            createAppSpy.restore();

        }));

    });

    describe("App life cycle", () => {

        let lifeCircleActionSpy;

        before(async(function* () {

            core = new Core(params);

            lifeCircleActionSpy = sinon.spy(core, "_lifeCircleAction");

            yield* core.initializeApps();

        }));

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

            let coreAppConfigStub = sinon.stub(core.app.config, "get");

            coreAppConfigStub.withArgs("coreAppEnabled").returns(true);

            yield core.start();

            assert.isTrue(coreAppStartStub.calledOnce);
            assert.isTrue(appStartStub.calledOnce);


            coreAppStartStub.restore();
            appStartStub.restore();

            coreAppConfigStub.restore();

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

            let coreAppConfigStub = sinon.stub(core.app.config, "get");

            coreAppConfigStub.withArgs("coreAppEnabled").returns(true);

            yield core.stop();

            assert.isTrue(coreAppStopStub.calledOnce);
            assert.isTrue(appStopStub.calledOnce);

            coreAppStopStub.restore();
            appStopStub.restore();

            coreAppConfigStub.restore();

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

            let coreAppConfigStub = sinon.stub(core.app.config, "get");

            coreAppConfigStub.withArgs("coreAppEnabled").returns(true);

            yield core.restart();

            assert.isTrue(coreAppRestartStub.calledOnce);
            assert.isTrue(appRestartStub.calledOnce);

            coreAppRestartStub.restore();
            appRestartStub.restore();

            coreAppConfigStub.restore();

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

    describe("Process Events Handling", () => {

        let processExitHandlerStub, getProcessStub, processStub;

        beforeEach(() => {

            processExitHandlerStub = sinon.stub(Core, "processExitHandler", () => {});
            getProcessStub = sinon.stub(Core, "getProcess");
            processStub = new events.EventEmitter();
            processStub.exit = sinon.stub();
            getProcessStub.returns(processStub);

            core = new Core(params);

        });

        afterEach(() => {

            processExitHandlerStub.restore();
            core = processStub = null;
            getProcessStub.restore();

        });

        it("Should handle 'exit' event", () => {

            assert.isFalse(processExitHandlerStub.called, "Shouldn't be called");

            processStub.emit("exit", "my error");

            assert.isTrue(processExitHandlerStub.called, "Should be called once");
            assert.deepEqual(processExitHandlerStub.args[0][0], {cleanup: true});
            assert.equal(processExitHandlerStub.args[0][1], "my error");

        });

        it("Should handle 'SIGINT' event", () => {

            assert.isFalse(processExitHandlerStub.called, "Shouldn't be called");

            processStub.emit("SIGINT", "my error");

            assert.isTrue(processExitHandlerStub.called, "Should be called once");
            assert.deepEqual(processExitHandlerStub.args[0][0], {exit: true});

        });

        it("Should handle 'uncaughtException' event", () => {

            assert.isFalse(processExitHandlerStub.called, "Shouldn't be called");

            processStub.emit("uncaughtException");

            assert.isTrue(processExitHandlerStub.calledOnce, "Should be called once");
            assert.deepEqual(processExitHandlerStub.args[0][0], {exit: true});

        });

        it("Should handle 'message' event with 'kill' command", () => {

            assert.isFalse(processStub.exit.called, "Shouldn't be called");

            processStub.emit("message", {cmd: "kill"});

            assert.isTrue(processStub.exit.calledOnce, "Should call .exit once");

        });

    });
});