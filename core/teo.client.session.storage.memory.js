/*!
 * Client session memory storage
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 1/11/15
 */

var Storage = (function(config) {
    var api = {};
    var storage = {};

    /**
     * Getter of value
     * @param {String} sessionId
     * @param {String} key
     * @returns {*|undefined}
     */
    api.get = function(sessionId, key) {
        return storage[sessionId] && storage[sessionId][key] || undefined;
    };

    /**
     * Setter of value
     * @param {String} sessionId
     * @param {String} key
     * @param {*} val
     */
    api.set = function(sessionId, key, val) {
        if (typeof storage[sessionId] === "undefined") {
            storage[sessionId] = {};
        }

        storage[sessionId][key] = val;
    };

    return api;
});

module.exports = Storage;
