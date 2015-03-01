/*!
 * App context. Helps to form req, res for further work
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/15/14
 */

var Base = require("./teo.base"),
    utils = require("./teo.utils"),
    Session = require("./teo.client.session"),
    Csrf = require("./teo.client.session.csrf");

exports = module.exports = Base.extend({
    req: null,
    res: null,
    initialize: function(opts) {
        utils.extend(this, {
            req: opts.req,
            res: opts.res
        });
        this.req.session = new Session({req: this.req, res: this.res});
        this.req.session.csrf = new Csrf({req: this.req, res: this.res});
    }
});