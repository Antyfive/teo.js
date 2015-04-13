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
            ormPrefix: "./teo.db.orm."
        }, {
            ormName: config.ormName,
            // teo.js orm adapter
            adapterName: config.adapter,
            // parse adapter config
            adapterConfig: {
                // adapters
                adapters: _.extend({}, config.adapters),
                // Connections Config
                // Setup connections using the named adapter configs
                connections: _.extend({}, config.connections)
            }
        });

        this.loadOrm();
        this.createOrm();
    },
    /**
     * Loads ORM
     */
    loadOrm: function() {
        try {
            this[this.ormName] = require(this.ormPath + "/" + this.ormPrefix + this.ormName.toLowerCase());
        } catch(e) {
            logger.error(e.message, e.stack);
            throw new Error(e.message);
        }
    },
    /**
     * Creates ORM instance
     */
    createOrm: function() {
        this.orm = new this[this.ormName]({
            ormName: this.ormName,
            adapter: this.adapter,
            adapterConfig: this.adapterConfig
        });
    },
    /**
     * Connects db
     * @param {Function} callback
     */
    connectDb: function(callback) {

    }
});