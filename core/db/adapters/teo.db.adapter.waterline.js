/*!
 * Waterline adapter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/8/15
 */

var Base = require("../../teo.base"),
    _ = require("underscore");

var WaterlineAdapter = Base.extend({
    collections: [],
    adapters: [],
    connections: [],
    initialize: function(config) {
        this.Waterline = config.orm;
        this.adapters = config.adapters;
        this.connections = config.connections;

        this.prepareAdapters();
        this.createOrm();
    },

    createOrm: function() {
        this.waterline = new this.Waterline();
    },

    addCollection: function(collection) {

        // Make sure our collection defs have `identity` properties
        collection.identity = collection.identity || Object.keys(collection)[0];

        // Fold object of collection definitions into an array
        // of extended Waterline collections.
        this.collections.push(this.Waterline.Collection.extend(collection));
    },

    /**
     * Prepare adapters
     */
    prepareAdapters: function() {
        _(this.adapters).each(function (def, identity) {
            // Make sure our adapter defs have `identity` properties
            def.identity = def.identity || identity;
        });
    },

    /**
     * Loads collections into orm
     */
    loadCollections: function() {
        this.collections.forEach(function (collection) {
            this.waterline.loadCollection(collection);
        }.bind(this));
    },

    connect: function(callback) {
        this.loadCollections();
        // Initialize Waterline
        this.waterline.initialize({
            adapters: this.adapters,
            connections: this.connections
        }, callback);
    }
});

exports = module.exports = WaterlineAdapter;