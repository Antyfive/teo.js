/*!
 * Client Res context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

"use strict";

const
    _ = require("lodash"),
    http = require("http"),
    mime = require("mime"),
    Stream = require("stream"),
    Base = require("teo-base");

// ---- mime types additional settings
mime.default_type = "application/octet-stream";
// extra mime types
mime.define({
    "font/ttf": ["ttf"],
    "font/eot": ["eot"],
    "font/otf": ["otf"],
    "font/woff": ["woff"]
});

class TeoRes extends Base {
    constructor(config) {
        super(config);

        this.res.send = this.send.bind(this);
        this.res.json = this.json.bind(this);
    }

    get res() {
        return this.config.res;
    }

    get req() {
        return this.config.req;
    }

    get pathname() {
        return this.req.pathname
    }

    json(obj) {
        this.res.setHeader("Content-Type", "application/json");
        this.send(200, obj, "json");
    }


    /**
     * Expects one or two arguments, if one argument is passed, then it's going to be a response body
     * res.send(body)
     * res.send(500, "errMsg")
     * res.send(200, body, "json") -- to set force header
     */
    send() {
        let args = [].slice.call(arguments),
            code = 200, body;

        let extension = _.getExtension(this.pathname);

        let contentType = mime.lookup(args[2] || extension || (this.req.headers.accept && this.req.headers.accept.match(/text\/html/) ? "text/html" : this.req.headers.accept) || "octet");
        let writeHeadObj = {};

        if (args.length === 1) {    // send just code or just body without a code
            code = +args[0];
            if (!TeoRes.isValidResponseCode(code)) {    // if it's not a status code (based on http.STATUS_CODES), than it's error
                code = 200;
                body = args[0];
            }
        }

        if (args.length > 1) {
            code = +args[0];
            if (!TeoRes.isValidResponseCode(code)) {
                code = 200;
            }
            body = args[1];
        }

        if (Buffer.isBuffer(body)) {
            writeHeadObj["Content-Length"] = body.length;
        }

        TeoRes.setContentTypeHeader(writeHeadObj, contentType);

        if (body instanceof Stream) {
            body.pipe(this.res);
            return;
        }

        let sendJson = (contentType.match(/json/) || (_.isObject(body) && !Buffer.isBuffer(body)));

        if (sendJson === true) {
            TeoRes.setContentTypeHeader(writeHeadObj, mime.lookup("json"));
        }

        if (contentType.match(/json/) && !_.isObject(body)) {
            logger.warn("Sending not a object as JSON body response:", body);
        }

        let response = sendJson ?
            TeoRes.buildRespObject(code, body) :
            (_.isString(body) || Buffer.isBuffer(body) ? body : http.STATUS_CODES[code]);

        if (_.isString(response) && !writeHeadObj["Content-Length"]) {
            writeHeadObj["Content-Length"] = Buffer.byteLength(response);
        }

        this.res.writeHead(code, writeHeadObj);

        if (this.req.method === "HEAD") {
            this.res.end();
            return;
        }

        this.res.end(response);
    }

    static buildRespObject(code, data) {
        let obj = {
            code,
            data,
            message: http.STATUS_CODES[code]
        };
        return JSON.stringify(obj);
    }

    static isValidResponseCode(code) {
        return !(!code || _.isNaN(code) || (code < 100 || code > 511));
    }

    static setContentTypeHeader(obj, contentType) {
        obj["Content-Type"] = `${contentType}; charset=UTF-8`;
        return obj;
    }
}

module.exports = TeoRes;