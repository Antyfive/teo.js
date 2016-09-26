/*!
 * Client Req context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

"use strict";

const
    Base = require("teo-base"),
    url = require("url"),
    querystring = require("querystring"),
    multiparty = require("multiparty"),
    _ = require("../lib/utils");

class ReqContext extends Base {
    constructor(config) {
        super(config);

        this.chunks = [];
        this.req.parsedUrl = this.parsedUrl = url.parse(this.req.url, true); // parse query string as well (second argument)
        this.req.pathname = this.pathname = this.parsedUrl.pathname;
        this.req.contentType = this.contentType = this.req.headers["content-type"] || "";
        this.req.query = this.query = this.parsedUrl.query;

        this.parseBody();
    }

    get req() {
        return this.config.req;
    }

    get contentType() {
        return this._contentType || "";
    }

    set contentType(val) {
        this._contentType = val || "";
    }

    parseBody() {
        if (!this.contentType.startsWith("multipart")) {
            this.endListener = this.onEnd.bind(this);
            this.dataListener = this.onData.bind(this);
            this.req
                .on("data", this.dataListener)
                .on("end", this.endListener);
        }
    }

    * parseForm() {
        if (this.contentType.startsWith("multipart")) { // TODO: implement a middleware based on https://github.com/Antyfive/teo-busboy
            let form = ReqContext.createFormParser();
            let parsedForm = yield _.promise((resolve, reject) => {
                form.parse(this.req, (err, fields, files) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    this.req.fields = fields;
                    this.req.files = files;

                    resolve({fields, files});
                });
            });

            return parsedForm;
        }
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
    
    static createFormParser() {
        return new multiparty.Form();
    }
}

module.exports = ReqContext;