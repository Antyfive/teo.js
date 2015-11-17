/*!
 * Gulp file
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/16/15
 */

"use strict";

const gulp = require("gulp"),
    runSequence = require("run-sequence"),
    config = require("config");

process.on("uncaughtException", (err) => {
    console.error(err.message, err.stack, err.errors);
    process.exit(255);
});

function requireTask(path) {
    let args = [].slice.call(arguments, 1);
    return function(callback) {
        let task = require(path).apply(this, args);

        return task(callback);
    };
}

gulp.on("err", (gulpErr) => {
    if (gulpErr.err) {
        // cause
        console.error("Gulp error details", [gulpErr.err.message, gulpErr.err.stack, gulpErr.err.errors].filter(Boolean));
    }
});

// tasks ---- ---- ---- ---- ---- ---- ---- ---- ----

gulp.task("test", requireTask('./tasks/test', {
    src: "test/es6/**/*.spec.js",
    reporter: "spec",
    require: ["./test/es6/common.js"]
}));

gulp.task("test:watch", requireTask("./tasks/testWatch", {
    src: "test/es6/**/*.spec.js"
}));