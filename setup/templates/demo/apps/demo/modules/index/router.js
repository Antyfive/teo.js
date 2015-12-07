/*!
 * Router example
 * @author Andrew Teologov <teologov.and@gmail.com>
 */

"use strict";

const indexController = require("./controllers");

module.exports = function(router) {
    console.log("Router has been mounted");

    /**
     * router.get('/', function* (req, res, next) {})
     * router.post('/:id', function* (req, res, next) {})
     * router.put('/:id', function* (req, res, next) {})
     * router.patch('/:id', function* (req, res, next) {})
     * router.delete('/:id', function* (req, res, next) {})
     */

    router.get("/", function* (req, res, next) {
        return {a: "index"};
    });

    router.get("/:id", function* (req, res, next) {
        this.render("index", req.params);
    });
};