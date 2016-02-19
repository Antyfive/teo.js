/*!
 * Teo.JS renderer spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/8/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase, teoLibDir  */

"use strict";

const renderer = require(`${teoLibDir}/renderer`),
    consolidate = require("consolidate");

describe("Testing Teo.JS Rendererer Lib", () => {

    let hoganStub;

    beforeEach(() => {

        hoganStub = sinon.stub(consolidate, "hogan", function* () {});

    });

    afterEach(() => {

        hoganStub.restore();

    });

    it("Should render module template", async(function* () {

        yield* consolidate.hogan("template", {test: true});

        assert.isTrue(hoganStub.calledOnce);
        assert.deepEqual(hoganStub.args[0], ["template", {test: true}]);

    }));

});