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
    _ = require("./teo.utils"),
    Path = require("path");

exports = module.exports = Base.extend({
    initialize: function(opts) {
        this._extensionsRegistry = {};

        _.extend(this, {
            filePath: opts.filePath
        });

        if (opts.extensions) {
            this.add(opts.extensions);
        }
    },

    /**
     * Add new extension
     * @param {Array|Object} extensions
     */
    add: function(extensions) {
        var extensions = _.isArray(extensions) ? extensions : [extensions];

        extensions.forEach(function(extension) {
            this._resolveExtension(extension);
        }.bind(this));
    },

    /**
     * Resolves extension
     * @param {Object} extension
     * @private
     */
    _resolveExtension: function(extension) {
        if (!_.isObject(extension)) {
            throw new Error("Extension config should be an object");
        }

        if (!extension.hasOwnProperty("file") && !extension.hasOwnProperty("module")) {
            throw new Error("Extension config should have 'module' or 'file' property");
        }

        if(!extension.hasOwnProperty("name")) {
            throw new Error("Extension config should have 'name' property");
        }
        var pathToExt = extension.hasOwnProperty("file") ?
                Path.join(this.filePath, extension.file) :  // local extension
                    extension.module;   // module

        var _extension = this.__requireExtension(pathToExt);

        this._extensionsRegistry[extension.name] = _extension;

    },

    /**
     * Requires extension
     * @param {String} path
     * @returns {*}
     * @private
     */
    __requireExtension: function(path) {
        var _extension;

        try {
            _extension = require(path);
        } catch(e) {
            logger.error(e);
            throw new Error(e.message);
        }

        return _extension;
    }
});