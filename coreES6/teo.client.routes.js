/*!
 * Client routes implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/7/15
 */

"use strict";

const
    Base = require("./teo.base"),
    pathToRegexp = require("path-to-regexp-wrap")({end: true}),
    _ = require("./teo.utils");

class Routes extends Base {
    constructor(config) {
        super(config);

        this.namespaces = {};
        this.routes = {
            "get": {},
            "post": {},
            "put": {},
            "patch": {},
            "delete": {}
        };
    }

    /**
     * Add new route
     * @param {String} type
     * @param {String} route
     * @param {String|*} namespace
     * @param {Function} callback
     */
    addRoute(type, route, namespace, callback) { // /get/:id
        var routes = this.routes[type.toLowerCase()];

        if (routes === undefined || routes.hasOwnProperty(route))
            return false;

        routes[route] = {
            "match": pathToRegexp(route),
            "namespace": namespace,
            "callback": callback
        };

        return routes[route];
    }

    /**
     * Matcher of the route
     * @param {String} type
     * @param {String} path
     * @returns {*}
     */
    matchRoute(type, path) {
        var type = this.getRoutes()[type.toLowerCase()];

        if (type === undefined)
            return false;

        for (var r in type) {
            var match = type[r].match(path);
            if (match)
                return { params: match, handler: type[r], route: r, path: path };
        }
    }

    /**
     * Wrapper of add route
     * @param {String} type
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    newRoute(type, route, callback) {
        var namespace = this.getNamespace(route),
            route = (typeof namespace === "string") ? namespace + route : route;
        if ((this.routes[ type.toLowerCase() ].hasOwnProperty(route)))     // ? use multiple handlers for one route ?
            return false;

        return this.addRoute(type, route, namespace, callback);
    }

    /**
     * Get type handler
     * @param route :: regexp route
     * @param callback :: callback
     */
    get(route, callback) {
        return this.newRoute("get", route, callback);
    }

    /**
     * POST
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    post(route, callback) {
        return this.newRoute("post", route, callback);
    }

    /**
     * PUT
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    put(route, callback) {
        return this.newRoute("put", route, callback);
    }

    /**
     * PATCH
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    patch(route, callback) {
        return this.newRoute("patch", route, callback);
    }

    /**
     * DELETE
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    delete(route, callback) {
        return this.newRoute("delete", route, callback);
    }

    /**
     * Add namespace for route
     * @param {String} ns
     * @param {Array} routes
     */
    addNamespace(ns, routes) {
        (Array.isArray(this.namespaces[ns]) || (this.namespaces[ns] = []));
        this.namespaces[ns].push.apply(this.namespaces[ns], routes);
    }

    /**
     * Getter of namespace by route
     * @param {String} route
     * @return {String} :: key value of the
     */
    getNamespace(route) {
        for (var ns in this.namespaces)
            if (!!~this.namespaces[ns].indexOf(route))
                return ns;
    }

    // getters ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    /**
     * Routes getter
     * @returns {{get: {}, post: {}, put: {}, patch: {}, delete: {}}}
     */
    getRoutes() {
        return this.routes;
    }
}

module.exports = Routes;