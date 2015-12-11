/*!
 * Test coverage task for Travis
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/11/15
 */

"use strict";

const shell = require("gulp-shell");

module.exports = function() {
    return shell.task("istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -u bdd --require ./test/es6/common.js --recursive ./test/es6 --bail");
};