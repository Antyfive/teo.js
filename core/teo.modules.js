/*!
 * Modules implementation (HMVC)
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/20/15
 */

"use strict";

const
    fs = require("fs"),
    path = require("path"),
    Base = require("teo-base"),
    _ = require("../lib/utils"),
    mountModule = require("../lib/moduleMounter"),
    mountModuleRouter = require("../lib/routerMounter"),
    lstat = _.thunkify(fs.lstat),
    readdir = _.thunkify(fs.readdir);

module.exports = class Modules extends Base {
    constructor(config) {
        super(config);

        this.loadedModules = new Map();
        this.mountedModules = new Map();
    }

    * collect() {
        if (!this.config.get("name")) {     // means, core app
            return;
        }
        let modulesDirName = this.config.get("modulesDirName");
        let modules = yield readdir(path.join(this.config.get("appDir"), modulesDirName));
        let l = modules.length;

        for (var i = 0; i < l; i++) {
            let currentModuleDir = modules[i];
            yield* this.addModule(currentModuleDir, path.join(this.config.get("appDir"), modulesDirName, currentModuleDir));
        }
    }

    /**
     * Ads module to registry
     * @param {String} moduleName
     * @param {String} absoluteModulePath
     */
    * addModule(moduleName, absoluteModulePath) {
        let args = [];
        // index.js and router.js are mandatory files
        let index = yield lstat(path.join(absoluteModulePath, "index.js"));
        let router = yield lstat(path.join(absoluteModulePath, "router.js"));
        let modelFiles = [];

        args.push(moduleName);
        args.push(path.join(absoluteModulePath, "index.js"));

        if (router.isFile()) {
            args.push(path.join(absoluteModulePath, "router.js"));
        }

        try {
            modelFiles = yield readdir(path.join(absoluteModulePath, "models"));
            if (modelFiles.length > 0) {
                args.push(this.parseModelsFileNames(modelFiles, absoluteModulePath));
            }
        } catch(e) {
            logger.error(e);
        }

        this.loadedModules.set(moduleName, mountModule.apply(this, args));
    }

    /**
     * Parses module files, and sets absolute path to each model
     * @param modelFiles
     * @param absoluteModulePath
     * @returns {Array|*}
     * @private
     */
    parseModelsFileNames(modelFiles, absoluteModulePath) {
        return modelFiles.filter(fileName => fileName.endsWith(".js")).map(fileName => path.join(absoluteModulePath, "models", fileName));
    }

    mountModules(context) {
        this.loadedModules.forEach((moduleMounter, moduleName) => {
            this.mountModule(moduleMounter, moduleName, context);
        });
    }

    mountModule(moduleMounter, moduleName, context) {
        // it will init index (module entry point), and save main handler (router) to mounted registry
        this.mountedModules.set(moduleName, moduleMounter.call(context, context));
    }

    /**
     * Runs previously modules modules
     * @param {Object} handlerContext :: context
     * @param {Object} router :: router instance
     * @param {Function} modelRegister :: registers new model
     */
    runMountedModules(handlerContext, router, modelRegister) {
        this.mountedModules.forEach((moduleRouteHandler, moduleName) => {
            try {
                moduleRouteHandler.call(
                    this,
                    handlerContext,
                    // router mounter. Wraps router methods with namespace (/moduleName/) and some middleware
                    mountModuleRouter.call(handlerContext,
                        router,
                        moduleName,
                        // replace "someModuleName" namespace with "" if it's an index
                        (this.config.get("indexPageModuleName") === moduleName) ? "" : undefined
                    ),
                    modelRegister
                );
            } catch(e) {
                logger.error(e);
                throw e;
            }
        });
    }

};