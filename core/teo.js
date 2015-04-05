/*!
 * Teo.js framework
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {13.03.14}
 */

var utils = require("./teo.utils"),
    Base = require("./teo.base"),
    Cluster = require("./teo.cluster");

// ----
global.version = require("../package.json").version;
global.copyright = "Powered by Teo.js";
global.logger = require("./teo.logger");
// ----
/**
 * Framework's entry point
 * @param {Object} [params]
 * @param {Function} [callback]
 * @constructor
 * @extends {Base}
 */
var Teo = Base.extend({
    isRunning: false,

    /**
     * Constructor
     * @param {Object} [params]
     * @param {Function} [callback]
     */
    initialize: function(params, callback) {
        var Core = require("./teo.core"),
            callback = utils.isFunction(callback) ? callback : null,
            self = this;
        this._parseParams(params);
        this.core = new Core({
            mode: this.mode,
            dir: this.dir,
            appsDir: this.appsDir,
            confDir: this.confDir
        }, function(err, core) {
            callback && callback.call(this, this);
            process.nextTick(function() {
                self.emit("ready", self);
            }.bind(this));
        }.bind(this));
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    },

    /**
     * Start framework
     * @param {String} [name] :: name of the application to run
     * @param {Function} [callback]
     */
    start: function(name, callback) {
        var args = [].slice.call(arguments);
        if (this.core.config.get("cluster").enabled) {
            var cluster = new Cluster(function() {
                this.core.start.apply(this.core, args);
            }.bind(this));
        }
        else {
            this.core.start.apply(this.core, args);
        }
    },

    stop: function(callback) {
        this.core.stop(callback);
    },

    _parseParams: function(params) {
        this.mode = ( process.argv[ 2 ] === 'production' ) ? process.argv[ 2 ] : 'development';
        this.dir = params.dirname || process.cwd().replace( /\\/g, '/' );// home dirname ( from where framework is started )
        this.appsDir = this.dir + '/apps';    // main apps dir
        this.confDir = this.dir + '/config';    // main apps dir
    }
});

exports = module.exports = Teo;