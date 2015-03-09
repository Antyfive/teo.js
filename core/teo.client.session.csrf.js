/*!
 * Tokens implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 10/25/14
 */

var _ = require("./teo.utils"),
    crypto = require('crypto'),
    Base = require("./teo.base");

module.exports = Base.extend({
    initialize: function(opts) {
        _.extend(this, {
            req: opts.req,
            res: opts.res,
            keyName: opts.config.keyName,
            secret: opts.config.secret
        });
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
        return this[this.keyName] || this.req.cookie.get(this.keyName);
    },
    generateHash: function() {  // TODO: separate module for generation of tokens, or move to utils
        return crypto.createHmac('sha256', this.secret).update(Math.random().toString() + new Date).digest('hex');
    },
    setToken: function(token) {
        // expires by session
        this.req.cookie.set(this.keyName, token);
        this[this.keyName] = token;
        this.req.session.set(this.keyName, token);
    },
    validate: function(token) {
        return this.getToken() === token;
    }
});