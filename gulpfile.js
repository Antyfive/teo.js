/*!
 * Gulp file
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/16/15
 */

"use strict";

const gulp = require("gulp"),
    argv = require("yargs").argv,
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

// test tasks ---- ---- ---- ---- ---- ---- ---- ---- ----

gulp.task("test", requireTask('./tasks/test', {
    src: "test/specs/**/*.spec.js",
    reporter: "spec",
    require: ["./test/specs/common.js"]
}));

gulp.task("test:watch", requireTask("./tasks/testWatch", {
    src: "test/specs/**/*.spec.js"
}));

gulp.task("test-cov", requireTask("./tasks/testCov"));
gulp.task("travis-test-cov", requireTask("./tasks/travisTestCov"));

// release tasks ---- ---- ---- ---- ---- ---- ---- ----

gulp.task("release:patch", requireTask("./tasks/release", {
    releaseType: "patch"
}));

gulp.task("release:minor", requireTask("./tasks/release", {
    releaseType: "minor"
}));

gulp.task("release:preminor", requireTask("./tasks/release", {
    releaseType: ["preminor", argv.type]   // gulp release:premajor --type=alpha/beta/rc => bump to next major with set type. E.g. 2.0.0-alpha.0
}));

gulp.task("release:prepatch", requireTask("./tasks/release", {
    releaseType: ["prepatch", argv.type]
}));

gulp.task("release:premajor", requireTask("./tasks/release", {
    releaseType: ["premajor", argv.type]
}));

gulp.task("release:major", requireTask("./tasks/release", {
    releaseType: "major"
}));

gulp.task("prerelease", requireTask("./tasks/release", {    // gulp prerelease --type=alpha/beta/rc => E.g. 2.0.0-alpha.1 (bumped to alpha.1)
    releaseType: ["prerelease", argv.type]
}));

gulp.task("publish", requireTask("./tasks/publish"));