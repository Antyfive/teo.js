/*!
 * Waterline ORM wrapper
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/13/15
 */

var Base = require("../../teo.base"),
    _ = require("underscore");

/**
 * ORM
 * @type {Function}
 * @returns {Function}
 */
exports = module.exports = Base.extend({
    initialize: function(config) {
        try {
            this.parseConfig(config);
            this.loadOrm();
            this.loadAdapter();
            this.createAdapter();
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },

    parseConfig: function(config) {
        var config = {
            adapterPath: "../adapters",
            ormName: config.ormName,
            adapterConfig: {
                adapters: this.loadAdapterDependencies(config.adapterConfig.adapters),
                // Setup connections using the named adapter configs
                connections: config.adapterConfig.connections
            },
            adapterName: config.adapterName
        };

        _.extend(this, config);

        return config;
    },

    loadOrm: function() {
        // require third party ORM
        this[this.ormName] = require(this.ormName);
    },

    loadAdapter: function() {
        this.loadedAdapter = require(this.adapterPath + "/" + this.adapterName);
    },

    createAdapter: function() {
        this[this.adapterName] = new this.loadedAdapter(_.extend({}, this.adapterConfig, {
            orm: this.getOrm()
        }));
    },

    /**
     * Orm getter
     * @returns {*}
     */
    getOrm: function() {
        return this[this.ormName];
    },

    /**
     * Adapter getter
     * @returns {*}
     */
    getAdapter: function() {
        return this[this.adapterName];
    },

    loadAdapterDependencies: function(adapters) {
        var result = {};

        _.each(adapters, function(adapter, k) {
            // require third party dependencies
            result[k] = require(adapter);
        });

        return result;
    },

    /**
     * Connects DB
     * @param {Function} callback
     */
    connect: function(callback) {
        this.getAdapter().connect(function(err, models) {
            if (err) {
                logger.error(err);
                throw err;
            }
            else {
                this._collections = models.collections;
                this._connections = models.connections;
                logger.success("DB is connected!");
            }
            callback();
        }.bind(this));
    },

    /**
     * Returns collections list
     * @returns {collections|*|Array}
     */
    collections: function() {
        return this._collections;
    },

    /**
     * Returns collection with passed name
     * @param {String} name
     * @returns {*}
     */
    collection: function(name) {
        return this._collections[name];
    },

    /**
     * Disconnect DB
     * @param {Function} callback
     */
    disconnect: function(callback) {
        this.getAdapter().disconnect(function(err) {
            if (err) {
                logger.error(err);
            }
            callback(err);
        });
    }
});