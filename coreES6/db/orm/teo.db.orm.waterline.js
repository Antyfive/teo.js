/*!
 * Teo DB waterline ORM
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/5/15
 */

"use strict";

const
    BaseOrm = require("./teo.db.orm");

module.exports = class WaterlineOrm extends BaseOrm {
    constructor(config) {
        super(config);
    }

    /**
     * Connect db
     */
    * connect() {
        let models = yield* super.connect();

        this._collections = models.collections;
        this._connections = models.connections;
    }

    /**
     * Disconnect DB
     */
    * disconnect() {
        yield* super.disconnect();
    }

    // getters ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    _getCollections() {
        return this._collections;
    }

    _getCollection(name) {
        return this._collections[name];
    }

    _getConnections() {
        return this._connections;
    }
};