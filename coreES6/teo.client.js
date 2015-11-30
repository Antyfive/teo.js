/*!
 * Teo.js client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/6/15
 */

"use strict";

const
    composition = require("composition"),
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

    applyConfig(config) {
        this.config = config.config;    // receiving app's config
        this.config.req = config.req;
        this.config.res = config.res;
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
        return this.req.pathname;
    }

    get contentType() {
        return this.req.contentType;
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
    * process() {
        yield* this.dispatch();
    }

    /**
     * Dispatch call after first process is finished
     */
    * dispatch() {
        if (this.route != null && (this.route.handler && (typeof this.route.handler === "function"))) {
            if (!_.isGenerator(this.route.handler)) {
                throw new Error("Route handler should be a generator function!");
            }
            try {
                //let context = yield* this.route.handler.apply(this, [this.req, this.res]);
                let handler = composition([function* (next) {
                    this.body = yield* this.route.handler.apply(this, [this.req, this.res, next]);
                }.bind(this)]);

                yield handler.call(this);

                if (this.body != null) {
                    this.res.send(this.body);
                }
            } catch(e) {
                logger.error(e);
                this.res.send(500);
            }
        }
        else if (this.extension != null) {
            if (this.req.headers["range"]) {
                var extension = _.getExtension(this.pathname);
                var contentType = mime.lookup(extension || this.req.headers.accept || "html") ;
                streamer.stream(this.req, this.res, path.normalize(path.join(this.config.get("appDir"), this.pathname)), contentType);
            } else {
                // TODO: cache, read from cache
                this.sendStatic(this.pathname.match(/\/public/) ?
                    this.pathname :
                        path.join("/public", this.pathname)
                );
            }
        }
        else { // TODO: refactor this behaviour. Try to send file and that's it.
            this.res.send(404);
        }
    }

    /**
     * Sends static
     * @param filePath
     */
    sendStatic(filePath) {
        this.readFileSafely(filePath, (err, dataBuffer) => {
            if (err) {
                this.res.send(404);
                return;
            }

            this.res.send(dataBuffer);
        });
    }

    /**
     * Checks paths, and reads static file
     * @param {String} filePath
     * @param {Function} callback
     */
    readFileSafely(filePath, callback) {    // lib code
        try {
            filePath = decodeURIComponent(filePath);    // decode url
        } catch(e) {
            callback(new Error("Can't decode file path"));
            return;
        }

        if (~filePath.indexOf("\0")) {  // zero byte
            callback(new Error("Zero byte error"));
            return;
        }

        //filePath = path.normalize(path.join(this.config.get("appDir"), filePath));

        if (filePath.indexOf(this.config.get("appDir")) !== 0) {
            callback(new Error("File was not found"));
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                callback(new Error("Not a file was found"));
                return;
            }

            this._readFile(filePath, (err, dataBuffer) => {
                if (err) {
                    callback(err);
                    return;
                }

                callback(null, dataBuffer);
            });
        });
    }

    /**
     * Reads file
     * @param {String} path
     * @param callback
     * @private
     */
    _readFile(path, callback) {
        let readStream = new fs.ReadStream(path/*, {encoding: "utf-8"}*/);
        let data = [];

        readStream.on("readable", () => {
            let read = readStream.read();
            if (read != null) {
                data.push(read);
            }
        });

        readStream.on("error", (err) => {
            logger.error(err);
            callback(err);
        });

        readStream.on("end", () => {
            callback(null, Buffer.concat(data));
        });
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

        this.readFileSafely(path.join(this.templatesDir, `${tpl}213.${this.config.get("templateSettings").extension}`), (err, template) => {
            if (err) {
                if (_.isFunction(callback)) {
                    callback(err);
                }
                else {
                    this.res.send(_.isNumber(err) ? err : 500);
                }
                logger.error(err);
                return;
            }
            let output = viewHelpers.render(template.toString("utf8"), context.partial, {delimiters: this.config.get("templateSettings").delimiters});
            if (_.isFunction(callback)) {   // if callback - than return output only
                callback(null, output);
            }
            else {  // otherwise, render layout
                delete context.partial;
                context.partial = {};
                context.partial[tpl] = output;
                /*let cached = this.app.cache.get(this.route.path);
                if (cached != null) {
                    this.res.send(cached);
                }*/
                //else {
                    // _mixinContextObj(obj);
                // TODO: allow multiple layouts per module
                    this.readFileSafely(`/templates/layout.${this.config.get("templateSettings").extension}`, function(err, template) {
                        if (err) {
                            this.res.send(500);
                            return;
                        }
                        //
                        let output = viewHelpers.render(template.toString("utf8"), context, {delimiters: this.config.get("templateSettings").delimiters});

                        /*if (Object.keys(this.req.params).length === 0 && this.config.get("cache").response === true) {       // TODO AT: make caching for routes with changeable params           // TODO AT: make caching for routes with changeable params
                            this.app.cache.add(this.route.path, output);
                        }*/

                        this.res.send(output);
                    }.bind(this));
                //}
            }
        });
    }
    // ---- ---- ---- ---- ---- ----
}

Client.routes = new Routes();

module.exports = Client;