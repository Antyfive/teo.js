/*!
 * Teo.js core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/3/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

const Core = require(teoBase + "/teo.core");

describe("Testing Teo Core", function () {

    let core,
        dir = process.cwd().replace( /\\/g, '/'),
        params = {
            appsDir: dir + "/apps",
            confDir: dir + "/config",
            dir: dir,
            mode: "development"
        };

    beforeEach(done => {

        core = new Core(params, done);

    });

    afterEach(() => {

        core = null;

    });
});