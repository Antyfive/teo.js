/*!
 * Waterline adapter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/6/15
 */

"use strict";

const
    _ = require("../../teo.utils"),
    Base = require("../../teo.base");

module.exports = class WaterlineAdapter extends Base {
    constructor(config) {
        super(config);
        this.collections = {};
        this.prepareAdapters();
        this.createOrm();
    }

    applyConfig(config) {
        this.Waterline = config.orm;    // TODO: do not pass orm, require it here
        this.adapters = config.adapters;
        this.connections = config.connections;
    }

    createOrm() {
        this.waterline = new this.Waterline();
    }

    addCollection(collection) {
        // Make sure our collection defs have `identity` properties
        collection.identity = collection.identity || Object.keys(collection)[0];

        // Fold object of collection definitions into an array
        // of extended Waterline collections.
        this.collections[collection.identity] = this.Waterline.Collection.extend(collection);
    }

    /**
     * Prepare adapters
     */
    prepareAdapters() {
        _(this.adapters).each(function (def, identity) {
            // Make sure our adapter defs have `identity` properties
            def.identity = def.identity || identity;
        });
    }

    /**
     * Loads collections into orm
     */
    loadCollections() {
        Object.keys(this.collections).forEach(function (name) {
            this.waterline.loadCollection(this.collections[name]);
        }.bind(this));
    }

    connect(callback) {
        this.loadCollections();
        // Initialize Waterline
        this.waterline.initialize({
            adapters: this.adapters,
            connections: this.connections
        }, callback);
    }

    disconnect(callback) {
        this.waterline.teardown(callback);
    }
};