/*!
 * Teo.js core
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {24.05.15}
 */

/* global logger */

const
    co = require("co"),
    fs = require("fs"),
    async = require("async"),
    Path = require("path"),
    cluster = require("cluster"),
    util = require("./teo.utils"),
    Base = require("./teo.base"),
    App = require("./teo.app");

class Core extends Base {
	constructor(config, callback) {
		super(config, callback);

        this.apps = {};
        this._bindProcessEvents();
        util.generator(function* () {
            yield util.async(this._createCoreApp.bind(this)).catch(logger.error);
            yield util.async(this.loadApps.bind(this)).catch(logger.error);
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
        this._app = yield this._createApp({
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
        return this._app;
    }
    /**
     * Create new app
     * @param {Object} options
     * @returns {*}
     * @private
     */
    _createApp(options) { // TODO: error's handler; generator (yield new App?)
        return util.promise(function(resolve, reject) {
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
            readDir = util.thunkify(fs.readdir);

        var apps = yield readDir(appsDir);

        var l = apps.length;
        for (var i = 0; i < l; i++) {
            let appName = apps[i];
            let appDir = appsDir + "/" + appName;
            let stat = yield util.thunkify(fs.lstat)(appDir);

            if (stat.isDirectory()) {
                yield util.async(this.registerApp.bind(this, appName));    // TODO: yield util.async(this.registerApp.bind(this, appName))
            }
        }
        return self.apps;
    }

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
     * @param {String} [name] :: application name
     */
    * start(name) {
        if (!util.isUndefined(name)) {  // start single app
            var app = this.getApp(name);
            yield app.start();

            return app;
        }
        else {
            for (var app in this.apps) {    // start all apps
                yield this.apps[app].start();
            }

            return this.apps;
        }
    }
    // TODO: generators
    _stop(done) {
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

    // getters / setters ----

    /**
     * Get app it's by name
     * @param {String} name
     * @returns {*}
     */
    getApp(name) {
        return this.apps[name];
    }

    get coreAppConfig() {
        return this._config;
    }

    set coreAppConfig(val) {
        this._config = val;
    }
}

module.exports = Core;