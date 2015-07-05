/*!
 * Client Req context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

const
    Base = require("./teo.base"),
    url = require("url"),
    querystring = require("querystring");

class TeoReq extends Base {
    constructor(config) {
        super(config);

        this.chunks = [];
        this.req.parsedUrl = this.parsedUrl = url.parse(this.req.url, true); // parse query string as well (second argument)
        this.req.pathname = this.pathname = this.parsedUrl.pathname;
        this.req.contentType = this.contentType = this.req.headers["content-type"];
        this.req.query = this.parsedUrl.query;

        this.bindEvents()
    }

    get req() {
        return this.config.req;
    }

    bindEvents() {
        this.req.on("end", this.onEnd.bind(this));
        this.req.on("data", this.onData.bind(this));
    }

    onData(chunk) {
        this.chunks.push(chunk);
    }

    onEnd() {
        var body = this.chunks.join();
        var parsedBody;

        try {
            // TODO: multipart
            parsedBody = (this.contentType === "application/json") ? JSON.parse(body) : querystring.parse(body);
            this.req.body = parsedBody;
        } catch(e) {
            this.emit("error", 500, e.message);
            return;
        }
        // ----
        /*var csrfToken = payload[this.req.csrf.keyName];

         if (csrfToken !== this.req.csrf.getToken()) {
         this.res.send(403, "Invalid CSRF token!");
         return;
         }*/
        this.emit("reqEnd");
    }

    /**
     * Set route's parsed params to request
     * E.g. /route/:id => id: *
     * @param val
     */
    set params(val) {
        this.req.params = val;
    }
}

module.exports = TeoReq;