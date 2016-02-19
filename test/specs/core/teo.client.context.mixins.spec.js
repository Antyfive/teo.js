/*!
 * Teo.JS renderer spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/8/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase, teoLibDir  */

"use strict";

const
    path = require("path"),
    mixins = require(`${teoBase}/teo.client.context.mixins`),
    renderer = require(`${teoLibDir}/renderer`),
    homeDir = process.cwd().replace( /\\/g, "/"),
    params = {
        homeDir : homeDir,
        appDir  : `${homeDir}/apps/test`,
        moduleTemplatesDir : `${homeDir}/apps/test/modules/index/templates`
    };

describe("Testing Teo.JS Client Context Mixins", () => {

    let renderStub, self;

    beforeEach(() => {

        let getStub = sinon.stub();

        getStub.withArgs("templateSettings").returns({
            extension: "template",
            engine: "hogan"
        });

        getStub.withArgs("appDir").returns(params.appDir);

        renderStub = sinon.stub(renderer, "render", function* () {});

        this.moduleTemplatesDir = params.moduleTemplatesDir;
        this.activeModuleName = "index";
        this.config = {
            get: getStub
        };
        this.res = {
            send: sinon.spy()
        };

        self = this;
    });

    afterEach(() => {

        renderStub.restore();
        delete this.moduleTemplatesDir;
        delete this.activeModuleName;
        delete this.config;
        delete this.res;
        self = null;

    });

    it("Should render module template with layout", async(function* () {

        let tplAbsPath = path.join(self.config.get("appDir"), self.moduleTemplatesDir, `index.template`);
        let layoutAbsPath = path.join(self.config.get("appDir"), `/templates/layout.template`);

        yield* mixins.render.bind(self)("index", {test: true}, {});

        assert.isTrue(renderStub.calledTwice);

        assert.deepEqual(renderStub.args[0], [tplAbsPath, self.config.get("templateSettings").engine, {test: true}]);
        assert.deepEqual(renderStub.args[1], [layoutAbsPath, self.config.get("templateSettings").engine, {"index": undefined}]);

    }));

    it("Should catch an error and send 500 response code", async(function* () {

        let loggerErrorSpy = sinon.spy(logger, "error");

        renderStub.restore();

        yield* mixins.render.bind(self)("index", {test: true}, {});

        assert.isTrue(loggerErrorSpy.calledOnce);
        assert.isTrue(self.res.send.calledOnce);
        assert.equal(self.res.send.args[0][0], 500, "Should end response with 500 error");

        loggerErrorSpy.restore();

    }));

});