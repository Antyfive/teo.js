/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

const
    _ = require("./teo.utils"),
    Base = require("./teo.base"),
    // Cluster = require("./teo.cluster"),
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
                    self.emit("ready", this);
                });
            }
        });
	}

    /**
     * Start framework
     * @param [appName] :: name of the application to start (or alternatively, start all)
     * @param callback
     */
    start(appName, callback) {
        /*if (this.core.config.get("cluster").enabled) {
            var cluster = new Cluster(function() {
                this.core.start.apply(this.core, args);
            }.bind(this));
        }
        else {*/
            _.generator(function* () {
                return yield this.core.start(appName);  // will return started app
            }.bind(this), function(err, res) {
                callback(null, res);
            });
        //}
    }
}

module.exports = Teo;