/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.05.15}
 */

var utils = require("./teo.utils"),
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
		this.core = new Core({
            mode: this.mode,
            homeDir: this.homeDir,
            appsDir: this.appsDir,
            confDir: this.confDir
        }, (err, core) => {
            debugger;
            if (err) {
                throw new Error(err);
            }
            else {
                this.callback.call(this, this);
                process.nextTick(() => {
                    this.emit("ready", this);
                });
            }
        });
	}
}

module.exports = Teo;