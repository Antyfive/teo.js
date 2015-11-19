/*!
 * Publish task
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/18/15
 */

"use strict";

const shell = require("gulp-shell");

module.exports = function() {
    return shell.task([
        "git push --tags origin HEAD:master",
        "npm publish"
    ]);
};