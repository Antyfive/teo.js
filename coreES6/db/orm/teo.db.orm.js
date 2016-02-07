/*!
 * Teo.JS ORM implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/5/15
 */

"use strict";

const
    Base = require("teo-base"),
    _ = require("../../teo.utils");


module.exports = class TeoORM extends Base {
    constructor(config) {
        super(config);

        this.connected = false;

        try {
            this.loadOrm();
            this.loadAdapter();
            this.createAdapter();
        } catch(e) {
            logger.error(e);
            throw new Error(e.message);
        }
    }

    applyConfig(config) {
        var config = {
            adapterPath: config.adapterPath || "../adapters",
            ormName: config.ormName,
            adapterConfig: {
                adapters: this.loadAdapterDependencies(config.adapterConfig.adapters),
                // Setup connections using the named adapter configs
                connections: config.adapterConfig.connections
            },
            adapterName: config.adapterName
        };

        _.extend(this, config);
    }

    loadOrm() {
        // require third party ORM
        this[this.ormName] = require(this.ormName);
    }

    loadAdapter() {
        this.loadedAdapter = require(this.adapterPath + "/" + this.adapterName);
    }

    createAdapter() {
        this[this.adapterName] = new this.loadedAdapter(_.extend({}, this.adapterConfig, {
            orm: this.getOrm()
        }));
    }

    /**
     * Orm getter
     * @returns {*}
     */
    getOrm() {
        return this[this.ormName];
    }

    /**
     * Adapter getter
     * @returns {*}
     */
    getAdapter() {
        return this[this.adapterName];
    }

    loadAdapterDependencies(adapters) {
        var result = {};

        _.each(adapters, function(adapter, k) {
            // require third party dependencies
            result[k] = require(adapter);
        });

        return result;
    }

    /**
     * Returns collections list
     * @returns {collections|*|Array}
     */
    collections() {
        return this._getCollections();
    }

    /**
     * Returns collection with passed name
     * @param {String} name
     * @returns {*}
     */
    collection(name) {
        return this._getCollection(name);
    }

    /**
     * Connections getter
     * @returns {*}
     */
    connections() {
        return this._getConnections();
    }

    // ---- ---- ---- ----
    /**
     * Connect db
     */
    * connect() {
        return yield _.promise((resolve, reject) => {
            this.getAdapter().connect((err, models) => {
                if (err) {
                    reject(err);
                    return;
                }
                logger.log("DB has been successfully connected!");
                this.connected = true;
                resolve(models);
            });
        });
    }

    /**
     * Disconnect DB
     */
    * disconnect() {
        return yield _.promise((resolve, reject) =>  {
            this.getAdapter().disconnect((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.connected = false;
                logger.log("DB has been successfully disconnected!");
                resolve();
            });
        });
    }

    /**
     * Check if connected
     * @returns {TeoORM.connected}
     */
    connected() {
        return this.connected;
    }

    // ---- ---- ---- ---- ---- ---- getters

    /**
     * Collections getter
     * @private
     */
    _getCollections() {}

    /**
     * Collection getter
     * @param {String} name
     * @private
     */
    _getCollection(name) {}

    _getConnections() {}
};