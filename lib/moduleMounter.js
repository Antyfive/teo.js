/*!
 * Module mounter lib.
 * Wraps each module for lazy loading
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/21/15
 */

"use strict";

module.exports = function(_moduleName, indexFileAbsPath, routerFilePath, modelFiles) {  // on module register

    return function moduleMounter(context) {   // run on app init, app's context
        debugger;
        let wrappedRouter = function noop() {};
        let modelsToAdd = [];

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
        if (routerFilePath) {   // router
            wrappedRouter = require("./handlerMounter")(routerFilePath);   // mount router and return it, expects router as argument
        }

        if (modelFiles && Array.isArray(modelFiles)) {  // models
            modelFiles.forEach((absPathToModel) => {
                modelsToAdd.push(require("./handlerMounter")(absPathToModel));
            });
        }

        return function mount(context) {    // context, router, dbclient
            wrappedRouter.apply(this, [].slice.call(arguments));

            if (modelsToAdd.length > 0) {
                let modelRegister = arguments[2];
                modelRegister && _applyModels(modelRegister, modelsToAdd);
            }
        }
    };

    function _applyModels(modelRegister, modelsToAdd) {
        modelsToAdd.forEach((wrappedModel) => {
            modelRegister(wrappedModel());  // wrapped model returns model Object
        });
    }
};
