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
            mode: this.config.mode,
            coreApp: true
        });
        // TODO:
        /*this.config = this._app.config;

        if (this.config.get("cluster").enabled) {
            this.setupWorkersLogging();
        }*/
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
            coreConfig: this._app.config
        });
        apps[appName] = application;

        return apps[appName];
        // TODO: errors handler
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
    _start(name, callback) {
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

    /**
     * Get app it's by name
     * @param {String} name
     * @returns {*}
     */
    getApp(name) {
        return this.apps[name];
    }
}

module.exports = Core;