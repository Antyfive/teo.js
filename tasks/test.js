/*!
 * Gulp test task
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/17/15
 */

"use strict";

const gulp = require("gulp");
const mocha = require("gulp-mocha");
const assert = require("assert");

//require("co-mocha");

module.exports = function(options) {

    return function() {
        // config needs the right env
        assert(process.env.NODE_ENV == "test", "NODE_ENV=test must be set");

        return gulp.src(options.src)
            .pipe(mocha(options));
    };

};
