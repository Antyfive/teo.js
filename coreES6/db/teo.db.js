/*!
 * Teo DB implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/5/15
 */

"use strict";

const
    Base = require("teo-base"),
    _ = require("../teo.utils");

module.exports = class TeoDB extends Base {
    constructor(config) {
        super(config);
        // if usage of db is enabled
        if (this.enabled) {
            try {
                this._loadOrm();
                this._createOrm();
            } catch(e) {
                logger.error(e);
                throw new Error(e.message);
            }
        }
    }

    applyConfig(config) {
        var config = {
            enabled: config.enabled,
            ormName: config.ormName,
            // teo.js orm adapter
            adapterName: config.adapterName,
            // parse adapter config
            adapterConfig: {
                // adapters
                adapters: _.extend({}, config.adapterConfig.adapters),
                // Connections Config
                // Setup connections using the named adapter configs
                connections: _.extend({}, config.adapterConfig.connections)
            }
        };

        _.extend(this, {
            ormPath: "./orm",
            ormPrefix: "teo.db.orm."
        }, config);
    }

    /**
     * Loads ORM
     * @private
     */
    _loadOrm() {
        // TODO: all ORMs should be moved to separate packages after plugin system will be implemented
        this[this.ormName] = require(this.ormPath + "/" + this.ormPrefix + this.ormName.toLowerCase());
    }

    /**
     * Creates ORM instance
     * @private
     */
    _createOrm() {
        this.orm = new this[this.ormName]({
            ormName: this.ormName,
            adapterName: this.adapterName,
            adapterConfig: this.adapterConfig
        });
    }

    /**
     * Getter of ORM instance
     * @returns {*}
     */
    getOrm() {
        return this.orm;
    }

    /**
     * Connects db
     */
    * connect() {
        yield* this.getOrm().connect();
    }

    /**
     * Disconnect db
     */
    * disconnect() {
        yield* this.getOrm().disconnect();
    }

    connected() {
        return this.getOrm().connected();
    }
};