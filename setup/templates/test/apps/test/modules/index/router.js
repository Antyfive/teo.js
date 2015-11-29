/*!
 * Router example
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/21/15
 */

"use strict";

const indexController = require("./controllers");

module.exports = function(router) {
    console.log("Router has been mounted");

    router.get("/", function* (req, res, next) {
       return {a: "index"};
    });

    router.get("/:id", function* (req, res, next) {
       return {a: 1, b: 2};
    });
};