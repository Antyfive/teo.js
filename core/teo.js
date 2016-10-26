/*!
 * Teo.JS framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */
"use strict";

const
    _ = require("../lib/utils"),
    Base = require("teo-base"),
    Cluster = require("./teo.cluster"),
    Core = require("./teo.core");

// ----
global.version = require("../package.json").version;
global.copyright = "Powered by Teo.JS";
global.logger = require("./teo.logger");

class Teo extends Base {
	constructor(config, callback) {
		super(config, callback);

		this._parseOptions();
        this.startCore();
	}

	_parseOptions() {
        this.mode = this.config.mode || process.env.NODE_ENV || "development";
        this.homeDir = this.config.homeDir || process.cwd().replace(/\\/g, "/");// home dirname ( from where framework is started )
        this.appsDir = this.homeDir + "/apps";    // main apps dir
        this.confDir = this.homeDir + "/config";    // config dir
	}

    /**
     * Starts Teo.JS core
     */
	startCore() {
        _.generator(function* () {
            yield* this.initializeCore();
        }.bind(this), (err) => {
            if (err) {
                logger.fatal(err);
                throw err;
            }
            _.isGenerator(this.callback) ? _.async(this.callback, this) : this.callback.call(this, this);

            setImmediate(() => {
                this.emit("ready", this);
                if (this.mode !== "test") {
                    logger.showLogo();
                }
            });
        });
    }

    /**
     * Creates & initializes a Teo.JS core
     */
    * initializeCore() {
        yield* this.createCore();
        yield* this.initializeApps();
    }

    /**
     * Creates new core instance
     */
    * createCore() {
        this.core = new Core({
            mode: this.mode,
            homeDir: this.homeDir,
            appsDir: this.appsDir,
            confDir: this.confDir
        });
    }

    /**
     * Initialize all apps
     */
    * initializeApps() {
        yield* this.core.initializeApps();
    }

    /**
     * Start application
     * @param [appName] :: name of the application to start (or alternatively, start all)
     */
    * start(appName) {
        if (this.core.app.config.get("cluster").enabled) {
            yield function(callback) {
                this._createCluster(callback);
            }.bind(this);
        }
        yield* this._runAppLifeCircleAction(appName, "start");
    }

    /**
     * Stop application
     * @param [appName] :: name of the application to stop (or alternatively, to stop all, if no name)
     */
    * stop(appName) {
        yield* this._runAppLifeCircleAction(appName, "stop");
    }

    /**
     * Restarts application
     * @param [appName] :: name of the application to stop (or alternatively, to stop all, if no name)
     * @returns {*}
     */
    * restart(appName) {
        yield* this._runAppLifeCircleAction(appName, "restart");
    }

    /**
     * Shutdown system
     * @returns {*}
     */
    * shutdown() {
        yield* this._runAppLifeCircleAction(undefined, "shutdown");
    }

    /**
     * Run app life circle action
     * @param {String|undefined} appName
     * @param {String} action
     * @private
     */
    * _runAppLifeCircleAction(appName, action) {
        let actions = ["start", "stop", "restart", "shutdown"];

        if (actions.indexOf(action) === -1) {
            throw new Error(`Not supported action '${action}' was received`);
        }

        try {
            yield* this.core[action](appName);
        } catch (e) {
            logger.fatal(e);
            throw e;
        }
    }

    /**
     * Creates a cluster instance
     * @param {Function} callback
     * @returns {*}
     * @private
     */
    _createCluster(callback) {
        return new Cluster(callback);
    }
}

module.exports = Teo;