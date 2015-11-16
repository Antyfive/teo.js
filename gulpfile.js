/*!
 * Gulp file
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/16/15
 */

"use strict";

const gulp = require("gulp"),
    runSequence = require("run-sequence"),
    config = require("config");

process.on('uncaughtException', function(err) {
    console.error(err.message, err.stack, err.errors);
    process.exit(255);
});