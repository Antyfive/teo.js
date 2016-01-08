/*!
 * Teo.js client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/6/15
 */

"use strict";

const
    composition = require("composition"),
    mime = require("mime"),
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    Routes = require("./teo.client.routes"),
    path = require("path"),
    fs = require("fs"),
    streamer = require("./teo.client.streamer"),
    ClientContext = require("./teo.client.context"),
    fileReader = require("../lib/fileReader");

/**
 * Client layers: app => client => context => req & res
 */

class Client extends Base {
    constructor(config, callback) {
        super(config, callback);

        // ---- ----
        this.context = new ClientContext({
            req: this.config.req,
            res: this.config.res,
            config: this.config
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
                    this.body = yield* this.route.handler.apply(this.context, [this.req, this.res, next]);
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
        else if (this.req.headers.range) {
            let contentType = mime.lookup(this.extension || this.req.headers.accept || "html") ;
            streamer.stream(this.req, this.res, this.config, path.normalize(path.join(this.config.get("appDir"), this.pathname)), contentType);
        }
        else {
            // TODO: cache, read from cache
            this.readFileSafely(this.pathname.startsWith("/public") ?
                this.pathname :
                    path.join("/public", this.pathname)
            );
        }
    }

    /**
     * Reads file
     * @param {String} filePath :: relative path starting from app's home
     */
    readFileSafely(filePath) {
        filePath = path.normalize(path.join(this.config.get("appDir"), filePath));

        fileReader.readFileSafely(filePath, (err, dataBuffer) => {
            if (err) {
                this.res.send(404);
                return;
            }

            this.res.send(dataBuffer);
        });
    }
}

Client.routes = new Routes();

module.exports = Client;