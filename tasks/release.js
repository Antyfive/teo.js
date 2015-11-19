/*!
 * Release task
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/17/15
 */

"use strict";

const shell = require("gulp-shell"),
    fs = require("fs"),
    semver = require("semver"),
    path = require("path"),
    runSequence = require("run-sequence"),
    gutil = require("gulp-util");

module.exports = function(options) {

    return function(done) {
        let packageJSON = require("../package.json");
        let args = [packageJSON.version];

        args = args.concat(Array.isArray(options.releaseType) ? options.releaseType : [options.releaseType]);

        packageJSON.version = semver.inc.apply(this, args);

        let json = JSON.stringify(packageJSON, null, 2);

        runSequence("test", () => {
            fs.writeFile(path.resolve(__dirname, "../package.json"), json, (err) => {
                if (err) {
                    gutil.log(gutil.colors.red(err.toString()));
                    throw err;
                }
                shell.task([
                    'git commit -m "release ' + packageJSON.version + '" -- package.json',
                    'git tag "' + packageJSON.version + '" -m "release ' + packageJSON.version + '"'
                ])(() => {
                    runSequence("publish", done);
                });
            });
        });
    };
};