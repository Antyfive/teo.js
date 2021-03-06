/*!
 * Teo.JS core
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

/* global logger */

"use strict";

const
    fs = require("fs"),
    path = require("path"),
    cluster = require("cluster"),
    _ = require("../lib/utils"),
    Base = require("teo-base"),
    App = require("./teo.app");

class Core extends Base {
	constructor(config, callback) {
		super(config, callback);

        this.apps = {};
        this.bindProcessEvents();
	}

	* initializeApps() {
        yield* this._createCoreApp();
        yield* this.loadApps();
    }

    bindProcessEvents() {
        const process = Core.getProcess();
        // Kill off the process
        process.on("message", (msg) => {
            if (msg.cmd && msg.cmd == "kill") {
                process.exit();
            }
        });
        // do something when app is closing
        process.on("exit", (err) => Core.processExitHandler({cleanup: true}, err));
        // catches ctrl+c event
        process.on("SIGINT", (err) => Core.processExitHandler({exit: true}));
        // catches uncaught exceptions // TODO: check if NODE_ENV != "development"
        process.on("uncaughtException", (err) => Core.processExitHandler({exit: true}, err));
    }

    * _createCoreApp() {
        this.app = yield this._createApp({
            homeDir: this.config.homeDir,
            appDir: this.config.appsDir,
            confDir: path.normalize(path.join(__dirname, "../config")),
            mode: this.config.mode,
            coreApp: true
        });
        if (this.app.config.get("cluster").enabled) {
            this._setupWorkersLogging();
        }

        return this.app;
    }

    /**
     * Create new app
     * @param {Object} options
     * @returns {*}
     * @private
     */
    _createApp(options) {
        return _.promise((resolve, reject) => {
            new App(options, (err, res) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    _setupWorkersLogging() {
        if (cluster.isMaster) {
            cluster.on("online", (worker) => {
                worker.on("message", (msg) => {
                    if (msg.type === "logging") {
                        logger.log(`WorkerID: ${msg.data.workerID} | ${msg.data.message}`);
                    }
                });
            });
        }
    }

    * loadApps() {
        let self = this,
            appsDir = this.config.appsDir,
            readDir = _.thunkify(fs.readdir);

        let apps = yield readDir(appsDir);

        let l = apps.length;
        for (let i = 0; i < l; i++) {
            let appName = apps[i];
            let appDir = path.join(appsDir, appName);
            let stat = yield _.thunkify(fs.lstat)(appDir);

            if (stat.isDirectory()) {
                yield* this.registerApp(appName);
            }
        }
        return self.apps;
    }

    /**
     * Register & create app in the system
     * @param appName
     * @returns {*}
     */
    * registerApp(appName) {
        let appDir = path.join(this.config.appsDir, appName),
            application,
            apps = this.apps;

        application = yield this._createApp({
            appDir: appDir,
            confDir: path.join(appDir, "/config"),
            homeDir: this.config.homeDir,
            appName,
            mode: this.config.mode,
            coreConfig: this.app.config
        });
        apps[appName] = application;

        return apps[appName];
        // TODO: errors handler
    }

    /**
     * Starts application
     * @param {String} [appName] :: application name
     */
    * start(appName) {
        yield* this._lifeCircleAction(appName, "start");
    }

    /**
     * Stops application
     * @param {String} [appName] :: application name
     * @returns {*}
     */
    * stop(appName) {
        yield* this._lifeCircleAction(appName, "stop");
    }

    /**
     * Restarts application
     * @param {String} [appName] :: application name
     * @returns {*}
     */
    * restart(appName) {
        yield* this._lifeCircleAction(appName, "restart");
    }

    /**
     * Complete shutdown of the system
     */
    * shutdown() {
        // Stop all apps
        yield* this.stop();
        // exit with cleanup
        Core.processExitHandler({cleanup: true});
    }

    /**
     * Does app life circle action
     * @param name :: app name
     * @param action :: action name
     * @private
     * supported actions: start, stop, restart
     */
    * _lifeCircleAction(name, action) {
        let actions = ["start", "stop", "restart"];

        if (actions.indexOf(action) === -1) {
            throw new Error(`Not supported action ${action} was received`);
        }

        if (this.app.config.get("coreAppEnabled") === true) {  // core app for admin purposes. No any web layout for it yet
            yield this.app[action]();
        }

        if (!_.isUndefined(name)) {  // perform action on single app
            let app = this.getApp(name);

            if (app) {
                yield* app[action]();
            }

            return app;
        }
        else {
            for (let app in this.apps) {    // perform action on all apps
                yield* this.apps[app][action]();
            }
        }

        return this.apps;
    }

    // getters / setters ----

    /**
     * Get app it's by name
     * @param {String} name
     * @returns {*}
     */
    getApp(name) {
        return this.apps[name];
    }

    static processExitHandler(options, err) {
        options = options || {};
        if (options.cleanup) {  // TODO: cleanup
            logger.info("Cleanup");
        }
        if (err) {
            logger.error(err);
        }
        if (options.exit) {
            logger.info("Closing Teo.JS");
            process.exit(err ? 1 : 0);
        }
    }

    static getProcess() {
        return process;
    }
}

module.exports = Core;