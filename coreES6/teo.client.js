/*!
 * Teo.js client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/6/15
 */

"use strict";

const
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    Routes = require("./teo.client.routes"),
    url = require("url"),
    path = require("path"),
    querystring = require("querystring"),
    fs = require("fs"),
    streamer = require("./teo.client.streamer"),
    ClientContext = require("./teo.client.context"),
    viewHelpers = require("./teo.viewHelpers");

/**
 * Client layers: app => client => context => req & res
 */

class Client extends Base {
    constructor(config, callback) {
        super(config, callback);

        this.app = this.config.app; // TODO: do not pass complete app reference here, only config, and file cache
        // ---- ----
        this.context = new ClientContext({
            req: this.config.req,
            res: this.config.res
        });
        // bind events ---- ----
        this.req.on("error", this.onReqError.bind(this));
        // ---- ----
        this.route = Client.routes.matchRoute(this.req.method, this.pathname);
        // set req route params
        if (this.route) {
            this.req.params = this.route.params;
        }
        this.extension = _.getExtension(this.pathname);// TODO: improve
        // ----
    }

    // error handlers ---- ----

    onReqError(code, message) {
        this.res.send(code, message);
    }

    // getters & setters ----

    get req() {
        return this.context.req;
    }

    get parsedUrl() {
        return this.req.parsedUrl;
    }

    get pathname() {
        return this.req.pathname
    }

    get contentType() {
        return this.req.contentType
    }

    get res() {
        return this.context.res;
    }

    // ---- ----

    static Factory(config) {
        return new Client(config);
    }
    // ---- ----

    /**
     * Process call on request end
     */
    process() {
        this.dispatch();
    }

    /**
     * Dispatch call after first process is finished
     */
    dispatch() {
        if (this.route != null && (this.route.handler && (typeof this.route.handler.callback === "function"))) {
            var context;
            try {
                context = this.route.handler.callback.apply(this, [this.req, this.res]);
            } catch (e) {
                logger.error(e);
                this.res.send(500);
            }
            // if route's callback returned object, - no render, and automatically send response object
            if (context != null) {
                this.res.send(context);
            }
        }
        else if (this.extension != null) {
            if (this.req.headers["range"]) {
                var extension = _.getExtension(this.pathname);
                var contentType = mime.lookup(extension || this.req.headers.accept || "html") ;
                streamer.stream(this.req, this.res, this.app.config.appDir + this.pathname, contentType);
            } else {
                this.serveStatic(this.pathname.match(/\/public/) ?
                    this.pathname :
                    path.join("/public", this.pathname), function(err, filepath, content) {
                    if (!err && content) {
                        this.res.send(content);
                    }
                    else {
                        this.res.send(err, filepath);
                    }
                }.bind(this));
            }
        }
        else
            this.res.send(404);
    }

    /**
     * Serve of static files
     * @param {String} path :: path to static
     * @param {Function} callback
     */
    serveStatic(path, callback) {
        var path = String(path),
            absPath = this.app.config.appDir + path,
            cached = this.app.cache.get(absPath);

        if (cached != null) {
            callback(null, absPath, cached);
        } else {
            fs.exists(absPath, function(exists) {
                if (exists) {
                    fs.readFile(absPath, function(err, data) {
                        if ( err ) {
                            logger.error(err.message);
                            callback(err.message, absPath);
                        } else {
                            if (this.app.config.get("cache").static === true) { // add to cache, if file exists
                                this.app.cache.add(absPath, data);
                            }
                            callback(null, absPath, data);
                        }
                    }.bind(this));
                } else {
                    callback(404, "Requested file does not exists");
                }
            }.bind(this));
        }
    }

    // ---- ---- ---- ---- ---- ----

    // TODO: get rid of this here
    /**
     * Renderer
     * @param {String} tpl :: template name
     * @param {Object} context :: data to render
     * @param {Function} [callback] :: if callback is passed - no send of the response
     */
    render(tpl, context, callback) {
        var context = context || {};

        this.serveStatic("/views/" + tpl + ".template", function(err, absPath, template) {
            if (err) {
                if (_.isFunction(callback)) {
                    callback(err);
                }
                else {
                    this.res.send(_.isNumber(err) ? err : 500);
                }
                return;
            }
            var output = viewHelpers.render(template, context.partial, {delimiters: this.app.config.get("delimiters")});
            if (_.isFunction(callback)) {   // if callback - than return output only
                callback(null, output);
            }
            else {  // otherwise, render layout
                delete context.partial;
                context.partial = {};
                context.partial[tpl] = output;
                let cached = this.app.cache.get(this.route.path);
                if (cached != null) {
                    this.res.send(cached);
                }
                else {
                    // _mixinContextObj(obj);
                    this.serveStatic("/views/layout.template", function(err, absPath, template) {
                        if (err) {
                            this.res.send(500);
                            return;
                        }
                        //
                        let output = viewHelpers.render(template, context, {delimiters: this.app.config.get("delimiters")});

                        if (Object.keys(this.req.params).length === 0 && this.app.config.get("cache").response === true) {       // TODO AT: make caching for routes with changeable params           // TODO AT: make caching for routes with changeable params
                            this.app.cache.add(this.route.path, output);
                        }

                        this.res.send(output);
                    }.bind(this));
                }
            }
        }.bind(this));
    }
    // ---- ---- ---- ---- ---- ----
}

Client.routes = new Routes();

module.exports = Client;