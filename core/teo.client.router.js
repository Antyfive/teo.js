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
    path = require("path"),
    isFunction = require("lodash/isFunction");

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
     * @param {Function} middleware
     * @param {Function} [handler] :: handler can be the last argument, in case if middleware was passed as a second arg.
     */
    addRoute(type, route, middleware, handler) { // /get/:id
        let routes = this.routes[type.toLowerCase()];

        if (routes === undefined || routes.hasOwnProperty(route)) {
            return;
        }

        if (!isFunction(handler)) {
            var handler = middleware;
            middleware = null;
        }

        if (isFunction(middleware)) {
            var middleware = [middleware];
        }

        routes[route] = {
            "match": pathToRegexp(route),
            "handler": handler,
            "middleware": middleware
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
                return {
                    params: match, 
                    handler: routes[r].handler, 
                    route: r, 
                    path: path, 
                    middleware: routes[r].middleware
                };
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
    newRoute(type, route, middleware, handler) {
        if ((this.routes[type.toLowerCase()].hasOwnProperty(route)))     // ? use multiple handlers for one route ?
            return;

        return this.addRoute(type, route, middleware, handler);
    }

    /**
     * Get type handler
     * @param route :: regexp route
     * @param {Function} middleware             
     * @param handler :: handler
     */
    get(route, middleware, handler) {
        return this.newRoute("get", route, middleware, handler);
    }

    /**
     * POST
     * @param {String} route
     * @param {Function} middleware             
     * @param {Function} handler
     * @returns {*}
     */
    post(route, middleware, handler) {
        return this.newRoute("post", route, middleware, handler);
    }

    /**
     * PUT
     * @param {String} route
     * @param {Function} middleware             
     * @param {Function} handler
     * @returns {*}
     */
    put(route, middleware, handler) {
        return this.newRoute("put", route, middleware, handler);
    }

    /**
     * PATCH
     * @param {String} route
     * @param {Function} middleware             
     * @param {Function} handler
     * @returns {*}
     */
    patch(route, middleware, handler) {
        return this.newRoute("patch", route, middleware, handler);
    }

    /**
     * DELETE
     * @param {String} route
     * @param {Function} middleware             
     * @param {Function} handler
     * @returns {*}
     */
    delete(route, middleware, handler) {
        return this.newRoute("delete", route, middleware, handler);
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
            get(_path, middleware, handler) {   // can call(path, handler) or (path, [middlewares], handler) 
                self.get(path.join(namespace, _path), middleware, handler);
                return this;
            },
            post(_path, middleware, handler) {
                self.post(path.join(namespace, _path), middleware, handler);
                return this;
            },
            put(_path, middleware, handler) {
                self.put(path.join(namespace, _path), middleware, handler);
                return this;
            },
            patch(_path, middleware, handler) {
                self.patch(path.join(namespace, _path), middleware, handler);
                return this;
            },
            delete(_path, middleware, handler) {
                self.delete(path.join(namespace, _path), middleware, handler);
                return this;
            }
        }
    }
}

module.exports = Router;