/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */
"use strict";

const
    _ = require("./teo.utils"),
    Base = require("./teo.base"),
    Cluster = require("./teo.cluster"),
    Core = require("./teo.core");

// ----
global.version = require("../package.json").version;
global.copyright = "Powered by Teo.js";
global.logger = require("./teo.logger");

class Teo extends Base {
	constructor(config, callback) {
		super(config, callback);

		this._parseOptions();
		this.createCore();
	}

	_parseOptions() {
		this.mode = this.config.mode || ((process.argv[2] === "production") ? process.argv[2] : "development");
        this.homeDir = this.config.homeDir || process.cwd().replace(/\\/g, "/");// home dirname ( from where framework is started )
        this.appsDir = this.homeDir + "/apps";    // main apps dir
        this.confDir = this.homeDir + "/config";    // config dir
	}

	createCore() {
        var self = this;
		this.core = new Core({
            mode: this.mode,
            homeDir: this.homeDir,
            appsDir: this.appsDir,
            confDir: this.confDir
        }, (err, core) => {
            if (err) {
                throw new Error(err);
            }
            else {
                self.callback.call(self, self);
                process.nextTick(() => {
                    self.emit("ready", self);
                });
            }
        });
	}

    /**
     * Start application
     * @param [appName] :: name of the application to start (or alternatively, start all)
     * @param callback
     */
    start(appName, callback) {
        return _.async(function* () {
            if (this.core.coreAppConfig.get("cluster").enabled) {
                yield _.promise(function(resolve, reject) {
                    new Cluster(resolve);
                }.bind(this));
            }
            yield _.async(this._runAppLifeCircleAction.bind(this, appName, "start", callback));
        }.bind(this));
    }

    /**
     * Stop application
     * @param [appName] :: name of the application to stop (or alternatively, to stop all, if no name)
     * @param {Function} callback
     */
    stop(appName, callback) {
        return _.async(this._runAppLifeCircleAction.bind(this, appName, "stop", callback));
    }

    /**
     * Restarts application
     * @param [appName] :: name of the application to stop (or alternatively, to stop all, if no name)
     * @param {Function} callback
     * @returns {*}
     */
    restart(appName, callback) {
        return _.async(this._runAppLifeCircleAction.bind(this, appName, "restart", callback));
    }

    /**
     * Shutdown system
     * @param {Function} callback
     * @returns {*}
     */
    shutdown(callback) {
        return _.async(this._runAppLifeCircleAction.bind(this, undefined, "shutdown", callback));
    }

    /**
     * Run app life circle action
     * @param {String|undefined} appName
     * @param {String} action
     * @param {Function} callback
     * @private
     */
    * _runAppLifeCircleAction(appName, action, callback) {
        let actions = ["start", "stop", "restart", "shutdown"];

        if (actions.indexOf(action) === -1) {
            throw new Error("Not supported action '" +action+ "' was received");
        }

        return _.generator(this.core[action].bind(this.core, appName), function(err, res) {
            if (err) {
                logger.error(err);
                throw new Error(err);
            } else {
                callback(null, res);
            }
        });
    }
}

module.exports = Teo;