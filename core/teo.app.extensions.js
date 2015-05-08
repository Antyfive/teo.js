/*!
 * Teo.js modules system.
 * It can be used to extend existing functionality
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/7/15
 */

/**
 * Add npm extensions (modules)
 * Add local extensions (files)
 */
var Base = require("./teo.base"),
    _ = require("./teo.utils");

exports = module.exports = Base.extend({
    initialize: function(opts) {
        this._extensionsRegistry = {};
    },

    add: function(extensions) {
        var extensions = _.isArray(extensions) ? extensions : [extensions];


    }
});