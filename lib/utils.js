/*!
 * Teo.JS utils
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

"use strict";

const _ = require("lodash"),
    util = require("util"),
    co = require("co"),
    path = require("path");

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
            return nodefn.apply(this, args)
        };
    }
};

util.generator = function(generator, done) {
    done = this.isFunction(done) ? done : () => {};

    return co(generator).then((res) => {
            done(null, res);
        }, (err) => {
            done(err);
    });
};

/**
 * Run async func
 * @param func
 * @param {Object} context
 * @returns {*}
 * Usage: yield util.async(this.asyncFunc.bind(this, param));
 */
util.async = function(func, context) {
    return co(function* () {
        let result;
        if (this.isGenerator(func)) {
            result = yield* func.call(context);
        }
        else {
            result = yield func.call(context);
        }
        return result;
    }.bind(this));
};

util.promise = function(fn) {
    return new Promise((resolve, reject) => {
        return fn(resolve, reject);
    });
};

util.getExtension = function(routeStr) {
    return path.extname(routeStr).replace(".", "").toLowerCase();
};

/**
 * Check if generator
 * @param {*} obj
 * @returns {Boolean}
 */
util.isGenerator = function(obj) {

    /**
     * Check if `obj` is a generator.
     *
     * @param {*} obj
     * @return {Boolean}
     * @api private
     */

    function isGenerator(obj) {
        return 'function' == typeof obj.next && 'function' == typeof obj.throw;
    }

    /**
     * Check if `obj` is a generator function.
     *
     * @param {*} obj
     * @return {Boolean}
     * @api private
     */
    function isGeneratorFunction(obj) {
        var constructor = obj.constructor;
        if (!constructor) return false;
        if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
        return isGenerator(constructor.prototype);
    }

    return (isGeneratorFunction(obj) || isGenerator(obj));
};

_.mixin(util);

module.exports = _;