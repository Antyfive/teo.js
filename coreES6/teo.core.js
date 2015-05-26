/*!
 * Teo.js core
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

/* global logger */

const fs = require("fs"),
    async = require("async"),
    Path = require("path"),
    cluster = require("cluster"),
    util = require("./teo.utils"),
    Base = require("./teo.base"),
    App = require("./teo.app");

export default class Core extends Base {
	constructor(config, callback) {
		super(config, callback);

        this._bindProcessEvents();
        this._createCoreApp(this.callback);
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

    /**
     * Creates core's app
     * @param {Function} callback
     * @private
     */
    _createCoreApp(callback) {
        // create first core's app
        this._app = this._createApp({
            homeDir: this.config.homeDir,
            appDir: this.config.appsDir,
            confDir: Path.normalize(__dirname + "/../config"),
            mode: this.config.mode,
            coreApp: true
        });

        this._app.once("app:ready", () => {
            this.coreAppConfig = this._app.config;

            if (this.coreAppConfig.get("cluster").enabled) {
                this._setupWorkersLogging();
            }
            this.loadApps((err) => {
                callback.call(this, err, this);
            });
        });
    }

    /**
     * Create new app
     * @param {Object} options
     * @returns {*}
     * @private
     */
    _createApp(options) {
        return new App(options);
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

    /**
     * Load apps
     * @param {Function }callback
     */
    loadApps(callback) {
        var self = this,
            appsDir = this.appsDir;

        fs.readdir(appsDir, (err, apps) => {
            if (err) {
                logger.error(err);
                callback(err);
                return;
            }

            // TODO: generator
            var functs = util.map(apps, function(appName) {
                return async.apply(function(app, next) {
                    var appDir = appsDir + "/" + app,
                        stat = fs.lstatSync(appDir);

                    if (stat.isDirectory()) {
                        self.registerApp(app, next);
                    }
                    else {
                        next();
                    }
                }, appName);
            });

            async.series(functs, callback);
        });
    }

    registerApp(appName, callback) {
        var appDir = this.appsDir + '/' + appName,
            application,
            apps = this.apps;

        application = this._createApp({
            appDir: appDir,
            confDir: appDir + "/config",
            homeDir: this.homeDir,
            name: appName,
            mode: this.mode,
            config: this._app.config
        });

        application.once("app:ready", function(app) {
            apps[appName] = app;
            callback(app);
        });

        application.on("error", (err) => {
            this._exitHandler({exit: true}, err);
        });
    }

    /**
     * Starts application
     * @param {String} [name] :: application name
     * @param {Function} [callback]
     * It can be used in two cases:
     * 1. Start all apps, if no name passed
     * 2. Start single application by passed name
     * // TODO: generators
     */
    start(name, callback) {
        if (util.isString(name)) {
            var name = name,
                callback = (typeof callback === "function") ? callback : function(){};
        }

        if (util.isFunction(name)) {    // start(callback)
            var callback = name,
                name = undefined;
        }

        if (!util.isUndefined(name)) {
            var app = this.getApp(name);
            app.start(() => {
                callback(null, app)
            });
        }

        else {
            var functs = [];
            util.each(this.apps, function(app) {
                // functs.push(app.start.bind(app));
                functs.push(function(next) {
                    app.start(next);
                });
            });

            async.series(functs, callback);
        }
    }
    // TODO: generators
    stop(done) {
        var functs = [];
        util.forEach(this.apps, (app) => {
            functs.push(function(next) {
                app.stop(next);
            })
        });
        functs.push((next) => {
            this._app.stop(next);
        });

        async.series(functs, (err) => {
            done && done(err);
            this._exitHandler({cleanup: true});
        });
    }

    restart() {   // TODO

    }
    // getters  ----
    getApps() {
        return this.apps;
    }

    /**
     * Get app it's by name
     * @param {String} name
     * @returns {*}
     */
    getApp(name) {
        return this.apps[name];
    }
}