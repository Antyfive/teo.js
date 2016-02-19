/*!
 * Client context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

"use strict";

const
    _ = require("lodash"),
    Base = require("teo-base"),
    ResContext = require("./teo.client.context.res"),
    ReqContext = require("./teo.client.context.req"),
    clientContextMixins = require("./teo.client.context.mixins");

class ClientContext extends Base {
    constructor(config) {
        super(config);

        this.req = new ReqContext({
            req: this.initialConfig.req // pass pure req
        });

        this.res = new ResContext({
            res: this.initialConfig.res, // pass pure res
            req: this.req
        });

        this._req.on("error", (e) => {});   // TODO: improve errors handling.
        // mixin context with methods, which will be available inside route handler in controllers
        this.mixinContext();
    }

    applyConfig(config) {
        // passed app's config
        this.config = config.config;

        this.initialConfig = {
            req: config.req,
            res: config.res
        };
    }

    // getters setters ---- ---- ---- ---- ---- ---- ---- ----

    get req() {
        // TODO: improve
        return this._req.req;
    }

    set req(val) {
        this._req = val;
    }

    get res() {
        return this._res.res;
    }

    set res(val) {
        this._res = val;
    }

    mixinContext() {
        _.extend(this, clientContextMixins);
    }
}

module.exports = ClientContext;