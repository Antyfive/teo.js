/*!
 * Client router implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/7/15
 */

"use strict";

const
    Base = require("teo-base"),
    pathToRegexp = require("path-to-regexp-wrap")({end: true}),
    _ = require("../lib/utils"),
    path = require("path");

class Router extends Base {
    constructor(config) {
        super(config);

        this.routes = {
            "get"   : {},
            "post"  : {},
            "put"   : {},
            "patch" : {},
            "delete": {}
        };
    }

    /**
     * Add new route
     * @param {String} type
     * @param {String} route
     * @param {Function} handler
     */
    addRoute(type, route, handler) { // /get/:id
        let routes = this.routes[type.toLowerCase()];

        if (routes === undefined || routes.hasOwnProperty(route)) {
            return;
        }

        routes[route] = {
            "match": pathToRegexp(route),
            "handler": handler
        };

        return routes[route];
    }

    /**
     * Matcher of the route
     * @param {String} method :: request method
     * @param {String} path
     * @returns {*}
     */
    matchRoute(method, path) {
        let routes = this.getRoutes()[method.toLowerCase()];

        if (!routes) {
            return false;
        }

        for (let r in routes) {
            let match = routes[r].match(path);
            if (match) {
                return {params: match, handler: routes[r].handler, route: r, path: path};
            }
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
        if ((this.routes[type.toLowerCase()].hasOwnProperty(route)))     // ? use multiple handlers for one route ?
            return;

        return this.addRoute(type, route, handler);
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

    // getters ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    /**
     * Routes getter
     * @returns {{get: {}, post: {}, put: {}, patch: {}, delete: {}}}
     */
    getRoutes() {
        return this.routes;
    }

    /**
     * Namespaces support
     * @param {String} namespace
     * @returns {*}
     */
    ns(namespace) {
        let self = this;
        return {
            get(_path, handler) {
                self.get(path.join(namespace, _path), handler);
                return this;
            },
            post(_path, handler) {
                self.post(path.join(namespace, _path), handler);
                return this;
            },
            put(_path, handler) {
                self.put(path.join(namespace, _path), handler);
                return this;
            },
            patch(_path, handler) {
                self.patch(path.join(namespace, _path), handler);
                return this;
            },
            delete(_path, handler) {
                self.delete(path.join(namespace, _path), handler);
                return this;
            }
        }
    }
}

module.exports = Router;