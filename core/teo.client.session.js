/*!
 * Teo.js client sessions handling
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/2/14
 */

var AppBase = require("./teo.base"),
    Sid = require("./teo.client.sid");

// sessions
/**
 * 1) Parse cookie
 * 2) Validate SSID
 * 3) Check if logged (userId)
 * 4) Try to restore session
 * 5) Delete session if cannot restore it
 * TODO: expires
 **/
var Session = AppBase.extend({
    // default storage type
    storageType: "memory",
    initialize: function(opts) {
        var Storage = this._loadStorage();
        this._setStorage(Storage);
    },

    /**
     * Loader of storage
     * @returns {*}
     * @private
     */
    _loadStorage: function() {
        var storage;

        try {
            storage = require("./teo.client.session.storage." + this.storageType);
        } catch(e) {
            console.error("Error: cannot load session storage with type: " + this.storageType);
        }

        return storage;
    },
    /**
     * Setter of new storage
     * @param {Function} Storage
     * @private
     */
    _setStorage: function(Storage) {
        this.constructor.storage = new Storage();
    },
    /**
     * Getter of storage
     * @returns {null|Storage}
     */
    getStorage: function() {
        return this.constructor.storage;
    },
    /**
     * Start new session
     * @param {Object} opts :: req res
     * @returns {*}
     */
    start: function(opts) {
        return this.constructor.start({req: opts.req, res: opts.res});
    }
}, {
    storage: null,
    /**
     * Starts new session
     * @param {Object} opts :: req res
     * @returns {{}}
     */
    start: function(opts) {
        var sid = new Sid({req: opts.req, res: opts.res});
        var _sid = sid.getSid();
        var storage = this.storage;
        var api = {};
        // ----
        api.set = function(key, val) {
            storage.set(_sid, key, val);
        };

        api.get = function(key) {
            return storage.get(_sid, key);
        };

        return api;
    }
});
exports = module.exports = Session;