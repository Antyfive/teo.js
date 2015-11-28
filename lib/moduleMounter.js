/*!
 * Module mounter lib.
 * Wraps each module for lazy loading
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/21/15
 */

"use strict";

module.exports = function(_moduleName, indexFileAbsPath, routerFilePath) {  // on module register

    return function moduleMounter(context) {   // run on app init, app's context
        debugger;
        let wrappedRouter = function noop() {};

        try {
            // initialize index.js of the particular module
            require("./handlerMounter")(indexFileAbsPath)(context); // init index.js of module
        }
        catch(e) {
            console.error(e);
        }
        // if no router, return noop function
        /*if (routerFilePath) {
            return require("./handlerMounter")(routerFilePath);   // mount router and return it, expects router as argument
        }
        else {
            return function noop() {};
        }*/
        if (routerFilePath) {
            wrappedRouter = require("./handlerMounter")(routerFilePath);   // mount router and return it, expects router as argument
        }
        // TODO: go through models, and apply wrapped models
        return function mount(context) {
            debugger;
            wrappedRouter.apply(this, [].slice.call(arguments));
        }
    }
};
