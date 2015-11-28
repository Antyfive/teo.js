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
        let fsStatSyncStub = sinon.stub(fs, "lstatSync");

        fsStatSyncStub.withArgs(path.join(moduleAbsPath, "index.js")).returns({
            isFile() {
                return true;
            }
        });

        fsStatSyncStub.withArgs(path.join(moduleAbsPath, "router.js")).returns({
            isFile() {
                return true;
            }
        });

        yield* modules.addModule("index", moduleAbsPath);

        assert.equal(modules.modules.size, 1);

        assert.isFunction(modules.modules.get("index"), "Module should be wrapped");

        fsStatSyncStub.restore();

    }));

});