/*!
 * Teo.js core
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

/* global logger */

"use strict";

const
    co = require("co"),
    fs = require("fs"),
    async = require("async"),
    Path = require("path"),
    cluster = require("cluster"),
    _ = require("./teo.utils"),
    Base = require("./teo.base"),
    App = require("./teo.app");

class Core extends Base {
	constructor(config, callback) {
		super(config, callback);

        this.apps = {};
        this._bindProcessEvents();
        _.generator(function* () {
            yield _.async(this._createCoreApp.bind(this)).catch(logger.error);
            yield _.async(this.loadApps.bind(this)).catch(logger.error);
            return this;
        }.bind(this), this.callback);
	}

    _bindProcessEvents() {
        // Kill off the process
        process.on("message", function(msg) {
            if (msg.cmd && msg.cmd == "kill") {
                process.exit();
            }
        });
        // do something when app is closing
        process.on("exit", this._exitHandler.bind(null,{cleanup:true}));
        // catches ctrl+c event
        process.on("SIGINT", this._exitHandler.bind(null, {exit:true}));
        // catches uncaught exceptions
        process.on("uncaughtException", this._exitHandler.bind(null, {exit:true}));
    }

    _exitHandler(options, err) {
        options = options || {};

        if (options.cleanup) {  // TODO: cleanup
            logger.info("cleanup");
        }
        if (err) {
            logger.error(err);
        }
        if (options.exit) {
            logger.info("Closing Teo.js");
            process.exit(err ? 1 : 0);
        }
    }

    * _createCoreApp() {
        this.app = yield this._createApp({
            homeDir: this.config.homeDir,
            appDir: this.config.appsDir,
            confDir: Path.normalize(__dirname + "/../config"),
            mode: this.config.mode
        });
        // TODO:
        /*
         this.config = this._app.config;
        if (this.config.get("cluster").enabled) {
            this.setupWorkersLogging();
        }*/
        this.coreAppConfig = this._app.config;

        return this.app;
    }
    /**
     * Create new app
     * @param {Object} options
     * @returns {*}
     * @private
     */
    _createApp(options) { // TODO: error's handler; generator (yield new App?)
        return _.promise(function(resolve, reject) {
            new App(options, function(err, res) {
                resolve(res);
            });
        });
    }

    _setupWorkersLogging() {
        if (cluster.isMaster) {
            cluster.on("online", function (worker) {
                worker.on("message", function (msg) {
                    if (msg.type === "logging") {
                        var message = "WorkerID: " + msg.data.workerID + " | " + msg.data.message;
                        logger.log(message);
                    }
                });
            });
        }
    }

    * loadApps() {
        var self = this,
            appsDir = this.config.appsDir,
            readDir = _.thunkify(fs.readdir);

        var apps = yield readDir(appsDir);

        var l = apps.length;
        for (var i = 0; i < l; i++) {
            let appName = apps[i];
            let appDir = appsDir + "/" + appName;
            let stat = yield _.thunkify(fs.lstat)(appDir);

            if (stat.isDirectory()) {
                yield _.async(this.registerApp.bind(this, appName));    // TODO: yield _.async(this.registerApp.bind(this, appName))
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
        var appDir = this.config.appsDir + '/' + appName,
            application,
            apps = this.apps;


        application = yield this._createApp({
            appDir: appDir,
            confDir: appDir + "/config",
            homeDir: this.config.homeDir,
            name: appName,
            mode: this.config.mode,
            coreConfig: this.coreAppConfig
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
        yield this._lifeCircleAction(appName, "start");
    }

    /**
     * Stops application
     * @param {String} [appName] :: application name
     * @returns {*}
     */
    * stop(appName) {
        yield this._lifeCircleAction(appName, "stop");
    }

    /**
     * Restarts application
     * @param {String} [appName] :: application name
     * @returns {*}
     */
    * restart(appName) {
        yield this._lifeCircleAction(appName, "restart");
    }

    /**
     * Complete shutdown of the system
     * TODO: tests
     */
    * shutdown() {
        // Stop all apps
        yield this.stop();
        // exit with cleanup
        this._exitHandler({cleanup: true});
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
            throw new Error("Not supported action `" +action+ "` was received");
        }

        if (this.coreAppConfig.get("coreAppEnabled") === true) {
            yield this.app[action]();
        }

        if (!_.isUndefined(name)) {  // perform action on single app
            var app = this.getApp(name);

            if (app) {
                yield app[action]();
            }

            return app;
        }
        else {
            for (var app in this.apps) {    // perform action on all apps
                yield this.apps[app][action]();
            }
        }

        return this.apps;
    }

    // getters  ----
    getApps() {
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

    /**
     * Core app getter
     * @returns {*}
     */
    get app() {
        return this._app;
    }

    /**
     * Core app setter
     * @param app
     */
    set app(app) {
        this._app = app;
    }

    get coreAppConfig() {   // todo: rename
        return this._config;
    }

    set coreAppConfig(val) {
        this._config = val;
    }
}

module.exports = Core;