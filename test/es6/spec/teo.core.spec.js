/*!
 * Teo.js core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

const
    Core = require(teoBase + "/teo.core"),
    App = require(teoBase + "/teo.app"),
    co = require("co"),
    // generator test case
    test = generator => done => co(generator).then(done, done);

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

        let bindProcessEventsSpy, createCoreAppSpy, loadAppsSpy;

        before(done => {

            bindProcessEventsSpy = sinon.spy(Core.prototype, "_bindProcessEvents");
            createCoreAppSpy = sinon.spy(Core.prototype, "_createCoreApp");
            loadAppsSpy = sinon.spy(Core.prototype, "loadApps");

            core = new Core(params, done);

        });

        after(() => {

            core = null;
            bindProcessEventsSpy.restore();
            createCoreAppSpy.restore();
            loadAppsSpy.restore();

        });

        it("Should initialize correctly", () => {

            assert.isTrue(bindProcessEventsSpy.calledOnce);

        });

        it("Should create core app", () => {

            assert.isTrue(createCoreAppSpy.calledOnce);
            assert.instanceOf(core._app, App);

        });

        it("Should load apps", () => {

            assert.isTrue(loadAppsSpy.calledOnce);
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

        it("Should register new app", test(function* () {

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
});