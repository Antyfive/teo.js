/*!
 * Teo.js client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/23/14
 * TODO: handle different types of protocols    ( http, https, websockets(?) etc. )
 */

/* global logger */

var Base = require("./teo.base"),
    Routes = require("./teo.client.routes"),
    helper = require('./teo.helper'),
    url = require('url'),
    path = require('path'),
    mime = require('mime'),
    http = require("http"),
    utils = require("./teo.utils"),
    // ClientContext = require("./teo.client.context"),
    Session = require("./teo.client.session"),
    Csrf = require("./teo.client.session.csrf"),
    streamer = require("./teo.client.streamer"),
    Cookie = require("./teo.client.cookie"),
    Compressor = require('./teo.compressor'),
    querystring = require("querystring");

// ---- mime types additional settings
mime.default_type = "text/html";
// extra mime types
mime.define({
    'font/ttf': ['ttf'],
    'font/eot': ['eot'],
    'font/otf': ['otf'],
    'font/woff': ['woff']
});

function Client(opts) {
    this.routes = new Routes();
    this.session = new Session({
        config: opts.app.config.get("session")
    });
    this.compressor = new Compressor();

    this.Factory = Base.extend(utils.extend(this.routes, {session: this.session, compressor: this.compressor}, {
        app: opts.app,
        // routes: this.routes,
        initialize: function(opts) {
            this.req = opts.req;
            this.res = opts.res;
            // ----
            this.parsedUrl = url.parse(this.req.url, true); // parse query string as well (second argument)
            this.pathname = this.parsedUrl.pathname;
            this.route = this.matchRoute(this.req.method, this.pathname);
            this.extension = helper.getExtension(this.pathname);// TODO: improve
            // this.context = new ClientContext({req: this.req, res: this.res, app: this.app});
            // ----
            // TODO: move mixins to the separate class
            this.mixinReq();
            this.mixinRes();
        },

        /**
         * Process call
         * Could be called with arguments. In this case immediate response with middleware error.
         * Usage: .process() || .process(errCode) || process("Err msg") || process(code, err)
         * TODO: improve
         */
        process: function() {
            if (arguments.length > 0) {
                this.res.send.apply(this.res, this.parseProcessArgs.apply(this, arguments));
            }
            if (this.req.method.toLowerCase() === "post") {
                var body = "";
                this.req.on("data", function(chunk) {
                    body += chunk
                });
                this.req.on("end", function() {
                    // ----
                    var contentType = this.req.headers["content-type"], payload;

                    try {
                        payload = (contentType === "application/json") ? JSON.parse(body) : querystring.parse(body);
                        this.setReqBody(payload);
                    } catch(e) {
                        this.res.send(500, e.message);
                        return;
                    }

                    // ----
                    var csrfToken = payload[this.req.csrf.keyName];

                    if (csrfToken !== this.req.csrf.getToken()) {
                        this.res.send(403, "Invalid CSRF token!");
                        return;
                    }
                    this.dispatch();
                }.bind(this));
            }
            else {
                this.dispatch();
            }
        },

        /**
         * Dispatch call after first process is finished
         */
        dispatch: function() {
            if (this.route != null && (this.route.handler && (typeof this.route.handler.callback === 'function'))) {
                this.context = this.route.handler.callback.apply(null, [this.req, this.res]);
                // if route's callback returned object, - no render, and automatically send response object
                if (this.context != null) {
                    this.res.send(this.context);
                }
            }
            else if (this.extension != null) {
                if (this.req.headers['range']) {
                    var extension = helper.getExtension(this.pathname);
                    var contentType = mime.lookup(extension || this.req.headers.accept || "html") ;
                    streamer.stream(this.req, this.res, this.app.dir + this.pathname, contentType);
                } else {
                    this.app.serveStatic(this.pathname.match(/\/public/) ?
                        this.pathname :
                        path.join('/public', this.pathname), function(err, filepath, content) {
                        if (!err && content) {
                            this.res.send(content);
                        }
                        else {
                            this.res.send(404);
                        }
                    }.bind( this ));
                }
            }
            else
                this.res.send(404);
        },

        mixinRes: function() {
            /**
             * Renderer
             * @param {String} tpl :: template name
             * @param {Object} context :: data to render
             * @param {Function} [callback] :: if callback is passed - no send of the response
             */
            this.res.render = function(tpl, context, callback) {
                var _mixinContextObj = function(obj) {  // TODO: mixin layout response in the one place
                    obj._csrfToken = this.req.csrf.getToken();
                    return obj;
                }.bind(this);
                var context = context || {};

                this.app.render(tpl, context.partial || {}, function(err, output) {
                    if (err) {
                        if (util.isFunction(callback)) {
                            callback(err);
                        }
                        else {
                            this.res.send(500);
                        }
                        return;
                    }
                    delete context.partial;
                    var obj = context;
                    obj.partial = {};
                    obj.partial[tpl] = output;

                    if (typeof callback === 'function') {   // if callback - than return output only
                        callback(null, output);
                    }
                    else {  // otherwise, render layout
                        var cached = this.app.cache.get(this.route.path);
                        if (cached != null) {
                            this.res.send(cached);
                        }
                        else {
                            _mixinContextObj(obj);
                            this.app.render('layout', obj, function (err, output) { // TODO: mixin render only in the res.
                                if (err) {
                                    this.res.send(500);
                                    return;
                                }
                                if (this.app.config.get('compressOutput'))
                                    output = this.compressor.compressHTML(output);    // TODO: refactor usage of compressor
                                if (Object.keys(this.req.params).length === 0 && this.app.config.get("cache").response === true) {       // TODO AT: make caching for routes with changeable params           // TODO AT: make caching for routes with changeable params
                                    this.app.cache.add(this.route.path, output);
                                }
                                this.res.send(output);
                            }.bind(this));
                        }
                    }
                }.bind(this));
            }.bind(this);

            this.res.json = function(obj) {
                this.res.setHeader('Content-Type', 'application/json');
                this.res.send(obj);
            }.bind(this);


            /**
             * Expects one or two arguments, if one argument is passed, then it's going to be a response body
             * res.end(body)
             * res.end(500, 'errMsg')
             */
            this.res.send = function() {
                var args = [].slice.call(arguments);
                var code;
                var body;

                var extension = helper.getExtension(this.pathname);
                var contentType = mime.lookup(extension || this.req.headers.accept || "html") ;

                if (args.length === 1) {
                    code = +args[0];
                    if (utils.isNaN(code)) {    // if it's not code, than it's error
                        code = 200;
                        body = args[0];
                    }
                }

                if (args.length > 1) {
                    code = +args[0];
                    body = args[1];
                }
                // set buffer to string
                if (body instanceof Buffer) {
                    body = body.toString();
                }
                var sendJson = (contentType.match(/json/) || utils.isObject(body));

                if (contentType.match(/json/) && !utils.isObject(body)) {
                    logger.warn("Sending not a object as JSON body response:", body);
                }

                this.res.writeHead(code, {'Content-Type': contentType}); // send content type

                var response = sendJson ?
                    this.buildRespObject(code, body) :
                        (utils.isString(body) ? body : http.STATUS_CODES[code]);

                this.res.end(response);

            }.bind(this);
        },

        mixinReq: function() {
            // currently, strict order of mixins here
            this.req.cookie = new Cookie({
                req: this.req,
                res: this.res,
                config: this.app.config.get("cookie")
            });
            this.req.session = this.session.start({
                req: this.req,
                res: this.res
            });
            this.req.csrf = new Csrf({
                req: this.req,
                res: this.res,
                config: this.app.config.get("csrf")
            });

            if (this.route) {   // extracted from route parsed parameters object (e.g /route/:id )
                this.req.params = this.route.params;
            }
            this.req.query = this.parsedUrl.query;
        },

        buildRespObject: function(code, data) {
            var obj = {
                code: code,
                data: data,
                message: http.STATUS_CODES[code]
            };
            return JSON.stringify(obj);
        },

        /**
         * Sets req body
         * @param {Object} body
         */
        setReqBody: function(body) {
            this.req.body = body;
        },

        /**
         * Parse process method arguments
         * @returns {Array}
         */
        parseProcessArgs: function() {
            var err = 500;
            var body;
            // Only error body is set // e.g. next("My err") || next(400)
            if (arguments.length === 1) {

                if (!+arguments[0]) {
                    body = arguments[0].toString();
                } else {
                    err = +arguments[0];
                }
            }
            // e.g. next(500, "Msg")
            else {
                err = +arguments[0];
                body = arguments[1].toString();
            }

            return [err, body];
        }
    }));

    return this;
}

exports = module.exports = Client;