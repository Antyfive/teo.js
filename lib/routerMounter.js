/*!
 * Router mounter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/29/15
 */

"use strict";

const path = require("path");

module.exports = function(router, moduleName) {
    // all routes for the particular module will be wrapped with namespace
    let ns = router.ns(`/${moduleName.toLowerCase()}`);

    function middleHandler(method) {

        function before() {
            this.templatesDir = path.join(this.config.get("appDir"),this.config.get("modulesDirName"), moduleName, "templates")
        }

        function after() {
            delete this.templatesDir;
        }

        return function(route, handler) {
            ns[method](route, function* (req, res, next) { // client's context inside
                before.call(this); // set template dir in context to module dir
                try {
                    console.log(`before ${moduleName}`);
                    let body = yield* handler.call(this, req, res, next);
                    return body; // return body
                } catch(e) {
                    logger.error(e);
                } finally {
                    console.log(`after ${moduleName}`);
                    after.call(this);
                }
                //after()   // delete template dir from context
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

/**
 * (function(moduleName) {
                    debugger;
                    let ns = router.ns(`/${moduleName.toLowerCase()}`);

                    let middleHandler = function(method, route, handler) {
                        debugger;
                        ns[method](route, function* (req, res, next) {
                            //before() // set template dir in context to module dir
                            try {
                                console.log("before");
                                let body = yield* handler(req, res, next);
                                return body; // return body
                            } finally {
                                debugger;
                                console.log("after");
                            }
                            //after()   // delete template dir from context
                        });
                    };

                    return {
                        // get, post, patch, put, delete
                        get(route, handler) {
                            debugger;
                            middleHandler("get", route, handler);
                        }
                    }
                }(moduleName))
 */