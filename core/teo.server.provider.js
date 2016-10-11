/**
 * Teo.JS server provider
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 9/10/2016
 */

"use strict";

const _ = require("../lib/utils"),
    http = require("http"),
    https = require("https");

module.exports = {
    /**
     * Returns server by a provided protocol type
     * @param {String} protocol
     */
    getServer(protocol) {
        switch (protocol.toLowerCase()) {
            case "http":
                return http;
            case "https":
                return https;
            default:
                return http;
        }
    }
};
