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
    Path = require("path"),
    Domain = require("domain"),
    Async = require("async");

exports = module.exports = Base.extend({
    initialize: function(opts) {
        this._loadedExtensions = {};
        this._installedExtensions = [];

        _.extend(this, {
            app: opts.app,
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

        this._loadedExtensions[extension.name] = _extension;

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
    },

    /**
     * Getter of all loaded extensions registry
     * @returns {{}|*}
     * @private
     */
    _getLoaded: function() {
        return this._loadedExtensions;
    },

    /**
     * Getter of installed extensions
     * @returns {{}|*}
     * @private
     */
    _getInstalled: function() {
        return this._installedExtensions;
    },

    /**
     * Getter of loaded extension by name
     * @param {String} name
     * @returns {*}
     * @private
     */
    _findLoadedByName: function(name) {
        return this._loadedExtensions[name];
    },

    /**
     * Run loaded extensions
     * @param {Function} callback
     */
    runAll: function(callback) {
        var functs = _.map(this._getLoaded(), function(extension, name) {
            return Async.apply(this.runSingle.bind(this), name);
        }, this);

        Async.series(functs, callback);
    },

    /**
     * Run single extension by extension name
     * @param {String} name
     * @param {Function} callback
     */
    runSingle: function(name, callback) {
        var _extension = this._findLoadedByName(name);

        if (!_.isObject(_extension)) {
            throw new Error("Extension '" + name + "' should be an object");
        }

        if (!_extension.hasOwnProperty("extension") || !_.isFunction(_extension.extension)) {
            throw new Error("'" + name + "' should have 'extension' property, and it should be a function");
        }

        var domain = Domain.create();

        domain.on("error", function(err) {
            logger.error("Extension "+ name + "error:", err);
        });

        domain.run(function() {
            _extension.extension.call(this.app, this.app);
            this._installedExtensions.push(name);
            callback();
        }.bind(this));
    }
});