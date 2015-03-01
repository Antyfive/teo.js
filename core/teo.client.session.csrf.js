/*!
 * Tokens implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 10/25/14
 */

var Sid = require("./teo.client.sid"),
    _ = require("./teo.utils");

/**
 * CSRF module
 * @extend {Sid}
 * @type {*}
 */
exports = module.exports = Sid.extend({
    req: null,
    res: null,
    keyName: "_csrfToken",
    // ---- ---- ---- ----
    initialize: function(opts) {
        _.extend(this, opts);
        this.genToken();
    },
    genToken: function() {
        var token = this.getToken();
        if (!token) {
            token = this.generateHash();
            this.setToken(token);
        }
        return token;
    },
    getToken: function() {
        return this.req.cookie.get(this.keyName) || this[this.keyName];
    },
    setToken: function(token) {
        this.req.cookie.set(this.keyName, token);
        this[this.keyName] = token;
        this.req.session.set("token", token);
    },
    validate: function(token) {
        return this.getToken() === token;
    }
});