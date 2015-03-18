/*!
 * Teo.js middleware
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/15/15
 */

var util = require("./teo.utils");
var async = require("async");

exports = module.exports = Middleware;

/**
 * Middleware
 * @constructor
 */
function Middleware() {
    if (!(this instanceof Middleware)) {
        return new Middleware();
    }
    this._middleware = [];
}

/**
 * Add middleware
 * @param {Function} func
 */
Middleware.prototype.add = function(func) {
    if (!util.isFunction(func)) {
        throw new Error("Trying to add not a function as a middleware!");
    }
    this._middleware.push(func);
};

/**
 * Run middleware chain
 * @param {Object} req
 * @param {Object} res
 * @param {Function} done
 */
Middleware.prototype.run = function(req, res, done) {
    if (this._middleware.length === 0) {
        done();
        return;
    }
    var functs = this._middleware.map(function(func) {
           return async.apply(func, req, res);
    });

    async.waterfall(functs, done);
};

/**
 * Count middleware functions
 * @returns {Number}
 */
Middleware.prototype.count = function() {
    return this._middleware.length;
};