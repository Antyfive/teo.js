/*!
 * Test coverage task for Travis
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/11/15
 */

"use strict";

const shell = require("gulp-shell");

module.exports = function() {
    return shell.task("istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -u exports --require ./test/specs/common.js --recursive ./test/specs --bail");
};