/*!
 * Client SID
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 1/11/15
 */

var Base = require("./teo.base"),
    crypto = require('crypto'),
    _ = require("./teo.utils");

/**
 * SID
 */
var Sid = Base.extend({
    req: null,
    res: null,
    sessionKeyName: "SID",
    // TODO: to config
    secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    lifetime: { // in seconds
        session: 60 * 60 * 24 * 10
    },
    httpOnly: true,
    initialize: function(opts) {
        _.isObject(opts) && _.extend(this, {
            req: opts.req,
            res: opts.res
        });
        this.setSid();
    },

    generateHash: function() {
        return crypto.createHmac('sha256', this.secret).update(Math.random().toString() + new Date).digest('hex');
    },

    setSid: function() {
        var sid = this.getSid();
        if (!sid) {
            sid = this.generateHash();
            this.req.cookie.set(this.sessionKeyName, sid, {expires: this.getExpireDate(), httpOnly: this.httpOnly});
        }
        this[this.sessionKeyName] = sid;
        return sid;
    },

    getSid: function() {
        return this.req.cookie.get(this.sessionKeyName) || this[this.sessionKeyName];
    },

    getExpireDate: function() {
        var date = new Date();
        return new Date(date.getTime() + this.lifetime.session * 1000);
    }
});

exports = module.exports = Sid;