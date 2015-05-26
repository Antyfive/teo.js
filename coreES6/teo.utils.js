/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

const _ = require("lodash"),
    util = require("util");

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

_.mixin(util);

export default _;