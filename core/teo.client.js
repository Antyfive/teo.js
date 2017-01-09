/*!
 * Teo.JS client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/6/15
 */

"use strict";

const
    composition = require("composition"),
    mime = require("mime"),
    Base = require("teo-base"),
    _ = require("../lib/utils"),
    Router = require("./teo.client.router"),
    path = require("path"),
    fs = require("fs"),
    ClientContext = require("./teo.client.context"),
    fileReader = require("../lib/fileReader"),
    co = require("co"),
    compose = require("../lib/compose");

/**
 * Client layers: app => client => context => req & res
 */

class Client extends Base {
    constructor(config) {
        super(config);

        // ---- ----
        this.context = new ClientContext({
            req: this.config.req,
            res: this.config.res,
            config: this.config
        });
        // bind events ---- ----
        this.req.on("error", this.onReqError.bind(this));
        // ---- ----
        this.route = this.config.appClientRouter.matchRoute(this.req.method, this.pathname);
        // set req route params
        if (this.route) {
            this.req.params = this.route.params;
        }
        this.extension = _.getExtension(this.pathname);
        // ----
    }

    applyConfig(config) {
        this.config = config.config;    // receiving app's config
        this.config.req = config.req;
        this.config.res = config.res;
        this.config.appClientRouter = config.appClientRouter;
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
        yield* this.parseMultipart();
        yield* this.dispatch();
    }

    /**
     * Dispatch call after first process is finished
     */
    * dispatch() {
        if (this.route != null && typeof this.route.handler === "function") {
            if (!_.isGenerator(this.route.handler)) {
                throw new Error("Route handler should be a generator function!");
            }
            try {
                //let context = yield* this.route.handler.apply(this, [this.req, this.res]);
                let chain = [];
                if (Array.isArray(this.route.middleware)) {
                    chain = this.route.middleware;
                }
                chain.push(function* (req, res, next) {
                    this.body = yield* this.route.handler.apply(this.context, [].slice.call(arguments));
                });
                
                let handler = compose(chain, this.req, this.res);

                yield handler.call(this);

                if (this.body !== null && this.body !== undefined) {
                    this.res.send(this.body);
                }
            } catch(e) {
                logger.error(e);
                this.res.send(e.code || 500);
            }
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

    /**
     * Parses multipart
     */
    * parseMultipart() {
        try {
            yield* this.reqContextObject.parseForm();
        } catch (err) {
            this.res.send(500, err.message);
        }
    }

    /**
     * Returns req context object api
     * @returns {*}
     */
    get reqContextObject() {
        return this.context.reqContextObject;
    }
}
// router provider
Client.router = () => new Router();

module.exports = Client;