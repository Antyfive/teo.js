/*!
 * Teo.js modules system.
 * It can be used to extend existing functionality
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/2/15
 */

"use strict";

const
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    Path = require("path");

module.exports = class Extensions extends Base {
    constructor(config) {
        super(config);

        this._loadedExtensions = {};
        this._installedExtensions = [];

        if (this.config.get("extensions")) {
            this.add(this.config.get("extensions"));
        }
    }

    applyConfig(config) {
        this.app = config.app;
        this.config = config.config;
    }

    /**
     * Add new extension
     * @param {Array|Object} extensions
     */
    add(extensions) {
        let _extensions = _.isArray(extensions) ? extensions : [extensions];

        _extensions.forEach((extension) => {
            this._resolveExtension(extension);
        });
    }

    /**
     * Resolves extension
     * @param {Object} extension
     * @private
     */
    _resolveExtension(extension) {
        if (!_.isObject(extension)) {
            throw new Error("Extension config should be an object");
        }

        if (!extension.hasOwnProperty("file") && !extension.hasOwnProperty("module")) {
            throw new Error("Extension config should have 'module' or 'file' property");
        }

        if(!extension.hasOwnProperty("name")) {
            throw new Error("Extension config should have 'name' property");
        }

        let pathToExt = extension.hasOwnProperty("file") ?
                Path.join(this.config.get("appDir"), this.config.get("localExtensionsDirPath"), extension.file) :  // local extension
                    extension.module;   // module

        this._loadedExtensions[extension.name] = this.__requireExtension(pathToExt);
    }

    /**
     * Requires extension
     * @param {String} path
     * @returns {*}
     * @private
     */
    __requireExtension(path) {
        var _extension;

        try {
            _extension = require(path);
        } catch(e) {
            logger.error(e);
            throw new Error(e.message);
        }

        return _extension;
    }

    /**
     * Getter of all loaded extensions registry
     * @returns {{}|*}
     * @private
     */
    _getLoaded() {
        return this._loadedExtensions;
    }

    /**
     * Getter of installed extensions
     * @returns {{}|*}
     * @private
     */
    _getInstalled() {
        return this._installedExtensions;
    }

    /**
     * Getter of loaded extension by name
     * @param {String} name
     * @returns {*}
     * @private
     */
    _findLoadedByName(name) {
        return this._loadedExtensions[name];
    }

    /**
     * Run loaded extensions
     */
    * runAll() {
        for (var extension in this._getLoaded()) {
            yield _.async(this.runSingle.bind(this, extension)).catch(logger.error);
        }

        return this;
    }

    /**
     * Run single extension by extension name
     * @param {String} name
     */
    * runSingle(name) {
        var _extension = this._findLoadedByName(name);

        if (!_.isObject(_extension)) {
            throw new Error(`Extension '${name}' should be an object`);
        }

        if (!_extension.hasOwnProperty("extension") || !_.isFunction(_extension.extension)) {
            throw new Error(`'${name}' should have 'extension' property, and it should be a function`);
        }

        try {
            if (_.isGenerator(_extension.extension)) {
                yield* _extension.extension.call(this.app, this.app);
            }
            else {
                _extension.extension.call(this.app, this.app);
            }
            this._installedExtensions.push(name);
        } catch(err) {
            logger.error(`Extension ${name} error:`, err);
        }
    }
};