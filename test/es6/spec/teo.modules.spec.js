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

describe.only("Testing Teo Modules", () => {

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

        modules = new Modules(configStub);

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

});