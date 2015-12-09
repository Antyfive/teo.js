/*!
 * Teo.JS demo app
 * @author Andrew Teologov <teologov.and@gmail.com>
 */

/* global logger */

"use strict";

const Teo = require("teo.js");

let app = new Teo(function* () {
    yield* this.start();
    logger.log("Teo.JS demo app has been started: http://localhost:3100/index");
});