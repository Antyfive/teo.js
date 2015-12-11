/*!
 * Test coverage task
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/10/15
 */

"use strict";

const shell = require("gulp-shell");

module.exports = function(options) {
    return shell.task(["istanbul cover ./node_modules/mocha/bin/_mocha -- -u bdd --require ./test/es6/common.js --recursive ./test/es6 --bail"]);
};