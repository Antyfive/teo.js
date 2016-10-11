/**
 * teo.server.provider.spec
 * Created by teologov on 10/11/16.
 * @author Andrew Teologov <teologov.and@gmail.com>
 */

"use strict";

const http = require("http"),
    https = require("https"),
    serverProvider = require(teoBase + "/teo.server.provider");

describe("Testing Teo.JS Provider", () => {

    it("Should return HTTPS server by passed protocol type", () => {

        const server = serverProvider.getServer("HTTPS");

        assert.isObject(server, "Should be an object");

    });

    it("Should return HTTP server by passed protocol type", () => {

        const server = serverProvider.getServer("HTTP");

        assert.isObject(server, "Should be an object");

    });

    it("Should return HTTP server as a default", () => {

        const server = serverProvider.getServer("SMTH");

        assert.isObject(server, "Should be an object");

    });

});