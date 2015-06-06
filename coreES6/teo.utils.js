/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

const _ = require("lodash"),
    util = require("util"),
    co = require("co");

/**
 * Creates a thunk from a passed function
 * Usage: var thunk = thunkify(fs.readFile);
 * @param {Function} nodefn
 * @returns {Function}
 */
util.thunkify = function(nodefn) { // [1]
    return function () { // [2]
        var args = Array.prototype.slice.call(arguments);
        return function (cb) { // [3]
            args.push(cb);
            nodefn.apply(this, args)
        }
    }
};

util.generator = function(generator, done) {    // TODO: catch errors
    return co(generator).then((res) => {
            done(null, res);
        }, (err) => {
            done(err);
    });
};

/**
 * Run async func
 * @param func
 * @returns {*}
 * Usage: yield util.async(this.asyncFunc.bind(this, param));
 */
util.async = function(func) {
    return co(function* () {
        yield func();
    });
};

util.promise = function(fn) {
    return new Promise((resolve, reject) => {
        return fn(resolve, reject);
    });
};

_.mixin(util);

module.exports = _;