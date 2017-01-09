/*!
 * Router mounter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/29/15
 */

"use strict";

const path = require("path");

module.exports = function(router, moduleName, optionalNamespace) {
    // all routes for the particular module will be wrapped with namespace
    let ns = router.ns(typeof optionalNamespace === "string" ? optionalNamespace : `/${moduleName.toLowerCase()}`);

    function middleHandler(method) {

        function before() {
            this.moduleTemplatesDir = path.join(this.config.get("modulesDirName"), moduleName, "templates");
            this.activeModuleName = moduleName;
        }

        function after() {
            delete this.moduleTemplatesDir;
            delete this.activeModuleName;
        }
        return function(route, middleware, handler) {   
            if (!handler && typeof middleware === 'function') { // case when no middleware passed to the route handler
                handler = middleware;
                middleware = null;
            }
            ns[method](route, middleware, function* (req, res, next) { // client's context inside
                before.call(this); // set template dir in context to module dir
                try {
                    let body = yield* handler.apply(this, [].slice.call(arguments));
                    return body; // return body
                } catch(e) {
                    logger.error(e);
                } finally {
                    after.call(this);
                }
            });
        }
    }

    return {
        get     : middleHandler("get"),
        post    : middleHandler("post"),
        put     : middleHandler("put"),
        patch   : middleHandler("patch"),
        delete  : middleHandler("delete")
    }
};