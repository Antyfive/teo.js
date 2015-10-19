/*!
 * Middleware implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/16/15
 */

"use strict";

var _ = require("./teo.utils"),
    compose = require("composition");

/**
 * Middleware
 * @constructor
 */
module.exports = class Middleware {
    constructor() {
        this._middleware = [];
    }

    add(func) {
        if (!_.isFunction(func)) {
            throw new Error("Trying to add not a function as a middleware!");
        }
        this._middleware.push(func);
    }

    /**
     * Run middleware
     * @param next :: first middleware
     * @param context :: context of middleware
     * @returns {Promise}
     */
    run(next, context) {
        let composed = compose([next].concat(this._middleware));
        return composed.call(context);
    }

    get length() {
        return this._middleware.length;
    }
};