/*!
 * Client dispatcher
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/23/14
 */

var Base = require("./teo.client.dispatcher"),
    AppContext = require("./teo.app.context");

var Dispatcher = Base.extend({
    initialize: function(opts) {
        this.req = opts.req;
        this.res = opts.res;
        this.routes = opts.routes;

        this.context = new AppContext({req: this.req, res: this.res});
    }
});

exports = module.exports = Dispatcher;