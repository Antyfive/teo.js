/*!
 * Client context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

"use strict";

const
    Base = require("teo-base"),
    ResContext = require("./teo.client.context.res"),
    ReqContext = require("./teo.client.context.req"),
    clientContextMixins = require("./teo.client.context.mixins");

class ClientContext extends Base {
    constructor(config) {
        super(config);

        this.req = new ReqContext({
            req: this.initialConfig.reqObject // pass pure req
        });

        this.res = new ResContext({
            res: this.initialConfig.resObject, // pass pure res
            req: this.req
        });

        this._req.on("error", (e) => {
            logger.error(e);
        });   // TODO: improve errors handling.
        // mixin context with methods, which will be available inside route handler in controllers
        this.mixinContext();
    }

    applyConfig(config) {
        // passed app's config
        this.config = config.config;

        this.initialConfig = {
            reqObject: config.req,
            resObject: config.res
        };
    }

    // getters setters ---- ---- ---- ---- ---- ---- ---- ----

    get req() { // returns the mixed req
        return this.initialConfig.reqObject;
    }

    set req(val) {
        this._req = val;
    }

    get res() { // // returns the mixed res
        return this.initialConfig.resObject;
    }

    set res(val) {
        this._res = val;
    }

    /**
     * Returns req context API
     * @returns {*}
     */
    get reqContextObject() {
        return this._req;
    }

    /**
     * Returns res context API
     * @returns {*}
     */
    get resContextObject() {
        return this._res;
    }

    mixinContext() {
        Object.assign(this, clientContextMixins);
    }
}

module.exports = ClientContext;