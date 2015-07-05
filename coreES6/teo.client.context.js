/*!
 * Client context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

const
    Base = require("./teo.base"),
    ResContext = require("./teo.client.context.res"),
    ReqContext = require("./teo.client.context.req");

class ClientContext extends Base {
    constructor(config) {
        super(config);

        this.req = new ReqContext({
            req: this.config.req
        });

        this.res = new ResContext({
            res: this.config.res,
            req: this.req
        });
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
}

module.exports = ClientContext;