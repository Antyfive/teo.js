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

        this.req.parsedUrl = this.parsedUrl = url.parse(this.req.url, true); // parse query string as well (second argument)
        this.req.pathname = this.pathname = this.parsedUrl.pathname;
        this.req.contentType = this.contentType = this.req.headers["content-type"] || "";
        this.req.query = this.query = this.parsedUrl.query;
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

    /**
     * Set route's parsed params to request
     * E.g. /route/:id => id: *
     * @param val
     */
    set params(val) {
        this.req.params = val;
    }
    
    static createFormParser() {
        return new multiparty.Form();
    }
}

module.exports = ReqContext;