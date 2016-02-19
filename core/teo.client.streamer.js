/*!
 * Client streamer implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/8/15
 */
/* global logger */

"use strict";

// Middleware to stream video, audio with support for different formats and device request for chunks
const fs = require("fs"),
    url = require("url"),
    events = require("events"),
    Throttle = require("throttle");

/**
 * Streamer implementation
 * @param {Object} req :: http req
 * @param {Object} res :: http res
 * @param {Object} appConfig :: app's config
 * @param {String} filePath :: path to file
 * @param {String} contentType
 * @returns {boolean}
 */
exports.stream = function(req, res, appConfig, filePath, contentType) {
    let stream, stat, info = {};
    let range = typeof req.headers.range === "string" ? req.headers.range : undefined;
    let reqUrl = req.parsedUrl;
    let settings = appConfig.get("streamer");

    info.mime = contentType;

    if (filePath) {
        try {
            info.path = decodeURIComponent(filePath);
        } catch (exception) {
            // Can throw URI malformed exception.
            res.send(400);
            return false;
        }
    }

    if (!info.path) {
        res.send(404);
        return false;
    }
    // TODO: security checks
    info.file = info.path.match(/(.*[\/|\\])?(.+?)$/)[2];

    try {
        stat = fs.statSync(info.path);

        if (!stat.isFile()) {
            res.send(404);
            return false;
        }
    } catch (e) {
        res.send(404);
        return false;
    }

    info.start = 0;
    info.end = stat.size - 1;
    info.size = stat.size;
    info.modified = stat.mtime;
    info.rangeRequest = false;

    if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
        // Check range contains numbers and they fit in the file.
        // Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
        info.start = isNumber(range[1]) && range[1] >= 0 && range[1] < info.end ? range[1] - 0 : info.start;
        info.end = isNumber(range[2]) && range[2] > info.start && range[2] <= info.end ? range[2] - 0 : info.end;
        info.rangeRequest = true;
    } else if (reqUrl.query.start || reqUrl.query.end) {
        // This is a range request, but doesn't get range headers. So there.
        info.start = isNumber(reqUrl.query.start) && reqUrl.query.start >= 0 && reqUrl.query.start < info.end ? reqUrl.query.start - 0 : info.start;
        info.end = isNumber(reqUrl.query.end) && reqUrl.query.end > info.start && reqUrl.query.end <= info.end ? reqUrl.query.end - 0 : info.end;
    }

    info.length = info.end - info.start + 1;

    downloadHeader(res, info, settings);

    // Flash vids seem to need this on the front, even if they start part way through. (JW Player does anyway.)
    if (info.start > 0 && info.mime === "video/x-flv") {
        res.write("FLV" + pack("CCNN", 1, 5, 9, 9));
    }
    stream = fs.createReadStream(info.path, {flags: "r", start: info.start, end: info.end});

    if (settings.throttle) {
        stream = stream.pipe(new Throttle(settings.throttle))
    }

    stream.pipe(res);
    return true;
};

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// A tiny subset of http://phpjs.org/functions/pack:880
function pack(format) {
    let result = "";

    for (let pos = 1, len = arguments.length; pos < len; pos++) {
        if (format[pos - 1] == "N") {
            result += String.fromCharCode(arguments[pos] >> 24 & 0xFF);
            result += String.fromCharCode(arguments[pos] >> 16 & 0xFF);
            result += String.fromCharCode(arguments[pos] >> 8 & 0xFF);
            result += String.fromCharCode(arguments[pos] & 0xFF);
        } else {
            result += String.fromCharCode(arguments[pos]);
        }
    }

    return result;
}

function downloadHeader(res, info, settings) {
    let code = 200, header;

    if (settings.forceDownload) {
        header = {
            "Expires": 0,
            "Cache-Control": "must-revalidate, post-check=0, pre-check=0",
            //"Cache-Control": "private",
            "Content-Type": info.mime,
            "Content-Disposition": "attachment; filename=" + info.file + ";"
        };
    } else {
        header = {
            "Cache-Control":        "public; max-age=" + settings.maxAge,
            "Connection":           "keep-alive",
            "Content-Type":         info.mime,
            "Content-Disposition":  "inline; filename=" + info.file + ";",
            "Accept-Ranges":        "bytes"
        };

        if (info.rangeRequest) {
            // Partial http response
            code = 206;
            header.Status = "206 Partial Content";
            header["Content-Range"] = "bytes " + info.start + "-" + info.end + "/" + info.size;
        }
    }

    header.Pragma = "public";
    header["Last-Modified"] = info.modified.toUTCString();
    header["Content-Transfer-Encoding"] = "binary";
    header["Content-Length"] = info.length;

    if (settings.cors) {
        header["Access-Control-Allow-Origin"] = "*";
        header["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept";
    }

    res.writeHead(code, header);
}