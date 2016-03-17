/*!
 * Teo.JS renderer spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/8/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase, teoLibDir  */

"use strict";

let renderer = require(`${teoLibDir}/renderer`),
    consolidate = require("consolidate");

describe("Testing Teo.JS Renderer Lib", () => {

    let getRendererEngineStub, hoganStub;

    beforeEach(() => {

        hoganStub = sinon.stub();
        hoganStub.returns(
            co(function* () {
                return "html"
            })
        );

        getRendererEngineStub = sinon.stub(renderer, "getRendererEngine");
        getRendererEngineStub.withArgs("hogan").returns(hoganStub);

    });

    afterEach(() => {

        getRendererEngineStub.restore();
        hoganStub = null;

    });

    it("Should render template", async(function* () {

        let result = yield* renderer.render("tplAbsPath", "hogan", {test: true}, {options: true});

        assert.isTrue(hoganStub.calledOnce);
        assert.deepEqual(hoganStub.args[0], ["tplAbsPath", {"options": true, "test": true}]);
        assert.equal(result, "html", "Return string should be correct");

    }));

});