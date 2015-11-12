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
     * @param {Function} handler
     */
    addRoute(type, route, namespace, handler) { // /get/:id
        var routes = this.routes[type.toLowerCase()];

        if (routes === undefined || routes.hasOwnProperty(route))
            return false;

        routes[route] = {
            "match": pathToRegexp(route),
            "namespace": namespace,
            "handler": handler
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
                return { params: match, handler: type[r].handler, route: r, path: path, namespace: type[r].namespace };
        }
    }

    /**
     * Wrapper of add route
     * @param {String} type
     * @param {String} route
     * @param {Function} handler
     * @returns {*}
     */
    newRoute(type, route, handler) {
        var namespace = this.getNamespace(route),
            route = (typeof namespace === "string") ? namespace + route : route;
        if ((this.routes[ type.toLowerCase() ].hasOwnProperty(route)))     // ? use multiple handlers for one route ?
            return false;

        return this.addRoute(type, route, namespace, handler);
    }

    /**
     * Get type handler
     * @param route :: regexp route
     * @param handler :: handler
     */
    get(route, handler) {
        return this.newRoute("get", route, handler);
    }

    /**
     * POST
     * @param {String} route
     * @param {Function} handler
     * @returns {*}
     */
    post(route, handler) {
        return this.newRoute("post", route, handler);
    }

    /**
     * PUT
     * @param {String} route
     * @param {Function} handler
     * @returns {*}
     */
    put(route, handler) {
        return this.newRoute("put", route, handler);
    }

    /**
     * PATCH
     * @param {String} route
     * @param {Function} handler
     * @returns {*}
     */
    patch(route, handler) {
        return this.newRoute("patch", route, handler);
    }

    /**
     * DELETE
     * @param {String} route
     * @param {Function} handler
     * @returns {*}
     */
    delete(route, handler) {
        return this.newRoute("delete", route, handler);
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