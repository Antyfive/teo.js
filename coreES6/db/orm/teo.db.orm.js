/*!
 * Teo.js ORM implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/5/15
 */

const
    Base = require("../../teo.base"),
    _ = require("../../teo.utils");


module.exports = class TeoORM extends Base {
    constructor(config) {
        super(config);

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
     * Connects DB
     * @param {Function} callback
     */
    _connect(callback) {
        this.getAdapter().connect(function(err, models) {
            if (err) {
                logger.error(err);
                throw new err;
            }
            else {
                this._collections = models.collections;
                this._connections = models.connections;
                logger.success("DB is connected!");
            }
            callback();
        }.bind(this));
    }

    /**
     * Returns collections list
     * @returns {collections|*|Array}
     */
    collections() {
        return this._collections;
    }

    /**
     * Returns collection with passed name
     * @param {String} name
     * @returns {*}
     */
    collection(name) {
        return this._collections[name];
    }

    * connect() {
        yield _.promise(function(resolve, reject) {
            try {
                this.getAdapter().connect(resolve);
            }
            catch(e) {
                reject(e);
            }
        }.bind(this));
    }

    /**
     * Disconnect DB
     * @param {Function} callback
     */
    disconnect(callback) {
        this.getAdapter().disconnect(function(err) {
            if (err) {
                logger.error(err);
            }
            callback(err);
        });
    }
};