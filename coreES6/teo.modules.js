/*!
 * Modules implementation (HMVC)
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/20/15
 */

"use strict";
// app registers application, and runs middlewares from app
// => register modules through middlewares
// => use lazy require of modules (via index.js?)
// automatically find index to mount it to "/"

// module directory consists of:
// controllers
// models
// templates
// client files ?
// try to load index => wrap router

// read module ((<<module>>)) => (wrapped index() => (wrapped router() => requires handler() => dispatch route)))

const
    fs = require("fs"),
    path = require("path"),
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    mountModule = require("../lib/moduleMounter");

module.exports = class Modules extends Base {
    constructor(config) {
        super(config);

        this.modules = new Map();   // TODO rename to loadedModules
        this.mountedModules = new Map();
    }

    applyConfig(obj) {
        debugger;
        this.config = obj.config;
    }

    * collect() {
        if (!this.config.get("name")) {     // means, core app
            return;
        }
        debugger;
        //yield* this._readModules();
        let modulesDirName = this.config.get("modulesDirName");
        // TODO: rename "name" to appName
        let modules = yield _.thunkify(fs.readdir)(path.join(this.config.get("appDir"), modulesDirName));
        let l = modules.length;

        debugger;
        for (var i = 0; i < l; i++) {
            let currentModuleDir = modules[i];
            yield* this.addModule(currentModuleDir, path.join(this.config.get("appDir"), modulesDirName, currentModuleDir));
        }
    }

    /**
     * Read each module
     * @private
     */
    * _readModules() {  // is not used
        let modulesDirName = this.config.get("modulesDirName");
        let modules = yield _.thunkify(fs.readdir)(modulesDirName);
        //let dirs = this.config.get("moduleDirs") || [];
        let l = modules.length;

        for (var i = 0; i < l; i++) {
            let currentModuleDir = modules[i];
            //yield* this._readModule(currentModuleDir, path.join(this.config.get("appDir"), modulesDirName, currentModuleDir));

        }
    }

    /**
     * Ads module to registry
     * @param {String} moduleName
     * @param {String} absoluteModulePath
     */
    * addModule(moduleName, absoluteModulePath) {
        let args = [];
        // index.js and router.js are mandatory fields
        let index = fs.lstatSync(path.join(absoluteModulePath, "index.js"));
        let router = fs.lstatSync(path.join(absoluteModulePath, "router.js"));
        let modelFiles = [];

        try {
            modelFiles = fs.readdirSync(path.join(absoluteModulePath, "models"));
        } catch(e) {
            logger.error(e);
        }

        //throw new Error(`Index.js file should exist in ${moduleName}.`);

        args.push(moduleName);
        args.push(path.join(absoluteModulePath, "index.js"));

        if (router.isFile()) {
            args.push(path.join(absoluteModulePath, "router.js"));
        }

        //if (modelsDir.isDirectory()) {
        //    let files = yield* _.thunkify(fs.readdir)(modelsDir);
        //}

        this.modules.set(moduleName, mountModule.apply(this, args));

    }

    /**
     * Reads single module
     * @param {String} moduleName
     * @param {String} absolutePath
     * @private
     */
    * _readModule(moduleName, absolutePath) {   // not used
        let dirs = this.config.get("moduleDirs") || [];
        let l = dirs.length;

        for (var i = 0; i < l; i++) {
            let currentDir = dirs[i];

            switch(currentDir) {
                case "models":
                    yield* this.loadModels();
                    break;
                case "controllers":
                    yield* this.loadControllers();
            }
        }
    }

    * __collectAppDirFiles(dir) {
        let files = yield _.thunkify(fs.readdir)(dir);
        let l = files.length;

        for (var i = 0; i < l; i++) {
            let file = path.join(dir, files[i]);
            yield* this.__loadFile(file);
        }
    }

    * __loadFile(filePath) {
        let stat = yield _.thunkify(fs.lstat)(filePath);

        if (!stat.isFile()) {
            throw new Error("Not a file was found!");
        }

        return this.__getScript(filePath);
    }

    __getScript(filePath) {
        let script;
        try {
            script = require(filePath);
        } catch(e) {
            logger.error(e);
            throw new Error(e);
        }
        return script;
    }

    /**
     * Loaded modules getter
     * @returns {Map|*}
     */
    getLoadedModules() {
        return this.modules;
    }

    mountModules(context) {
        this.modules.forEach((moduleMounter, moduleName) => {
            this.mountModule(moduleMounter, moduleName, context);
        });
    }

    mountModule(moduleMounter, moduleName, context) {
        // it will init index (module entry point), and save main handler (router) to mounted registry
        this.mountedModules.set(moduleName, moduleMounter.call(context, context));
    }

    runMountedRouters(handlerContext, router) {
        this.mountedModules.forEach((moduleRouteHandler, moduleName) => {
            moduleRouteHandler.call(this, handlerContext, router.ns(`/${moduleName}`));    // pass namespaced router. E.g. /users
        });
    }


};