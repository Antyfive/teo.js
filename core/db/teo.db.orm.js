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
        this.parseConfig(config);
        this.loadAdapter();
    },

    parseConfig: function(config) {
        _.extend(this, {
            adapterPath: "./adapters",
            ormName: config.ormName,
            adapterConfig: {
                adapters: config.adapterConfig.adapters,
                // Setup connections using the named adapter configs
                connections: config.adapterConfig.connections
            }
        }, config);
    },

    loadOrm: function() {
        try {
            // require third party ORM
            this[this.ormName] = require(this.ormName);
        } catch(e) {
            logger.error(e.message, e.stack);
            throw new Error(e.message);
        }
    },

    loadAdapter: function() {
        try {
            this.loadedAdapter = require(this.adapterPath + "/" + this.adapterName);
        } catch(e) {
            logger.error(e.message, e.stack);
            throw new Error(e.message);
        }
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
    }
});