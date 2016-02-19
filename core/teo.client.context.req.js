/*!
 * Client Req context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

"use strict";

const
    Base = require("teo-base"),
    url = require("url"),
    querystring = require("querystring");

class ReqContext extends Base {
    constructor(config) {
        super(config);

        this.chunks = [];
        this.req.parsedUrl = this.parsedUrl = url.parse(this.req.url, true); // parse query string as well (second argument)
        this.req.pathname = this.pathname = this.parsedUrl.pathname;
        this.req.contentType = this.contentType = this.req.headers["content-type"];
        this.req.query = this.query = this.parsedUrl.query;

        this.parseBody();
    }

    get req() {
        return this.config.req;
    }

    parseBody() {
        if (this.contentType && this.contentType.startsWith("multipart")) {
            this.parseForm();
        }
        else {
            this.endListener = this.onEnd.bind(this);
            this.dataListener = this.onData.bind(this);
            this.req
                .on("data", this.dataListener)
                .on("end", this.endListener);
        }
    }

    parseForm() {// TODO: parse multipart/*

    }

    onData(chunk) {
        this.chunks.push(chunk);
    }

    onEnd() {
        let bodyChunks = Buffer.concat(this.chunks).toString();

        try {
            if (bodyChunks.length > 0) {
                this.req.body = (this.contentType && this.contentType.startsWith("application/json")) ? JSON.parse(bodyChunks) : querystring.parse(bodyChunks);
            }
        } catch(e) {
            logger.error(e);
        }

        this.cleanup();
    }

    /**
     * Set route's parsed params to request
     * E.g. /route/:id => id: *
     * @param val
     */
    set params(val) {
        this.req.params = val;
    }

    /**
     * Remove listeners
     */
    cleanup() {
        this.req
            .removeListener("end", this.endListener)
            .removeListener("data", this.dataListener);
    }
}

module.exports = ReqContext;