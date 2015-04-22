/*!
 * Db
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/8/15
 */

var Base = require("../teo.base"),
    _ = require("underscore");

module.exports = Base.extend({
    initialize: function(config) {
        _.extend(this, {
            ormPath: "./orm",
            ormPrefix: "teo.db.orm."
        }, {
            enabled: config.enabled,
            ormName: config.ormName,
            // teo.js orm adapter
            adapterName: config.adapterName,
            // parse adapter config
            adapterConfig: {
                // adapters
                adapters: _.extend({}, config.adapters),
                // Connections Config
                // Setup connections using the named adapter configs
                connections: _.extend({}, config.connections)
            }
        });

        // if usage of db is enabled
        if (this.enabled) {
            this._loadOrm();
            this._createOrm();
        }
    },

    /**
     * Loads ORM
     * @private
     */
    _loadOrm: function() {
        try {
            // TODO: all ORMs should be moved to separate packages after plugin system will be implemented
            this[this.ormName] = require(this.ormPath + "/" + this.ormPrefix + this.ormName.toLowerCase());
        } catch(e) {
            logger.error(e);
            throw e;
        }
    },

    /**
     * Creates ORM instance
     * @private
     */
    _createOrm: function() {
        this.orm = new this[this.ormName]({
            ormName: this.ormName,
            adapterName: this.adapterName,
            adapterConfig: this.adapterConfig
        });
    },

    /**
     * Getter of ORM instance
     * @returns {*}
     */
    getOrm: function() {
        return this.orm;
    },

    /**
     * Connects db
     * @param {Function} callback
     */
    connect: function(callback) {
        this.getOrm().connect(callback);
    }
});