/*!
 * Modules Spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/21/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    fs = require("fs"),
    path = require("path"),
    Modules = require(`${teoBase}/teo.modules`);

describe("Testing Teo Modules", () => {

    let appDir = process.cwd().replace( /\\/g, "/"),
        params = {
            homeDir : appDir,
            appDir  : appDir + "/apps/test",
            confDir : appDir + "/config",
            mode    : "test"
        },
        configStub = {
            "config": {
                "get": sinon.stub()
            }
        },
        modules;

    beforeEach(() => {

        modules = new Modules(configStub.config);

    });

    afterEach(() => {

        modules = null;

    });

    it("Should add module to registry", async(function* () {

        let moduleAbsPath = path.join(params.appDir, "modules", "index");
        let lstatStub = sinon.stub(fs, "lstat", (args, cb) => {
            cb(null, {
                isFile: function() {return false}
            })
        });

        let readdirStub = sinon.stub(fs, "readdir", (args, cb) => {
           cb(null, []);
        });

        yield* modules.addModule("index", moduleAbsPath);

        assert.equal(modules.loadedModules.size, 1);

        assert.isFunction(modules.loadedModules.get("index"), "Module should be wrapped");

        lstatStub.restore();
        readdirStub.restore();

    }));

    it("Should mount loaded module", () => {

        let wrappedModule = sinon.stub();
        wrappedModule.returns({1: "1"});
        let context = {test: true};
        let mountModuleSpy = sinon.spy(modules, "mountModule");

        modules.loadedModules.set("test", wrappedModule);

        modules.mountModules(context);

        assert.isTrue(mountModuleSpy.calledOnce);
        assert.deepEqual(mountModuleSpy.args[0], [wrappedModule, "test", context]);

        assert.equal(modules.mountedModules.size, 1);
        assert.deepEqual(modules.mountedModules.get("test"), {1: "1"});

        mountModuleSpy.restore();

    });

    it("Should run mounted modules", () => {

        let mountedModuleStub = sinon.stub(),
            contextStub = {test: true},
            routerStub = {
                ns: sinon.stub()
            },
            modelRegisterStub = function() {};

        modules.mountedModules.set("Test", mountedModuleStub);

        modules.runMountedModules(contextStub, routerStub, modelRegisterStub);

        assert.isTrue(mountedModuleStub.calledOnce);
        assert.equal(mountedModuleStub.args[0].length, 3);

        assert.isTrue(routerStub.ns.calledOnce);
        assert.equal(routerStub.ns.args[0][0], "/test");

    });

});