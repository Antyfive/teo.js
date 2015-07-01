/*!
 * Client Res context
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/26/15
 */

const
    _ = require("lodash"),
    http = require("http"),
    mime = require("mime"),
    Base = require("./teo.base");

// ---- mime types additional settings
mime.default_type = "text/html";
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
    }

    get res() {
        return this.config.res;
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
        var args = [].slice.call(arguments);
        var code;
        var body;

        var extension = _.getExtension(this.pathname);
        var contentType = mime.lookup(args[2] || extension || this.config.req.headers.accept || "html");
        var writeHeadObj = {
            "Content-Type": contentType
        };

        if (args.length === 1) {
            code = +args[0];
            if (_.isNaN(code) || (code < 100 || code > 511)) {    // if it's not status code (based on http.STATUS_CODES), than it's error
                code = 200;
                body = args[0];
            }
        }

        if (args.length > 1) {
            code = +args[0];
            body = args[1];
        }
        // set buffer to string
        if (body instanceof Buffer) {
            body = body.toString();
        }
        var sendJson = (contentType.match(/json/) || _.isObject(body));

        if (contentType.match(/json/) && !_.isObject(body)) {
            logger.warn("Sending not a object as JSON body response:", body);
        }

        var response = sendJson ?
            this.buildRespObject(code, body) :
            (_.isString(body) ? body : http.STATUS_CODES[code]);

        if (_.isString(response)) {
            writeHeadObj["Content-Length"] = response.length;
        }
        // TODO: pipe
        this.res.writeHead(code, writeHeadObj);

        this.res.end(response);
    }

    buildRespObject(code, data) {
        var obj = {
            code: code,
            data: data,
            message: http.STATUS_CODES[code]
        };
        return JSON.stringify(obj);
    }
}

module.exports = TeoRes;