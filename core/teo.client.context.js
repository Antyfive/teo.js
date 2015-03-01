/*!
 * Client context. Helps to form req, res for further work
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/15/14
 * TODO: tests
 * TODO: it's not used at the moment
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
            res: opts.res,
            app: opts.app
        });

        this.mixinReq();
        this.mixinRes();

        return this;
    },
    mixinRes: function() {
        /**
         * Renderer
         * @param {String} tpl :: template name
         * @param {Object} context :: data to render
         * @param {Function} [callback]
         * @type {function(this:Dispatcher)}
         */
        this.res.render = function( tpl, context, callback ) {
            var context = context || {};
            this.app.render( tpl, context.partial || {}, function( err, output ) {
                if ( err ) {
                    this.sendError(500);
                    return;
                }
                delete context.partial;
                var obj = context;
                obj.partial = {};
                obj.partial[ tpl ] = output;

                ( typeof callback === 'function' ) ? callback( output ) : this.sendResp( obj, this.route );
            }.bind( this ));
        }.bind( this );
    },

    mixinReq: function() {
        this.req.session = new Session({req: this.req, res: this.res});
        this.req.session.csrf = new Csrf({req: this.req, res: this.res});
    }
});