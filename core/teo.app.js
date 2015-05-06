/*!
 * Teo.js App controller
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/7/14
 */

/* global copyright, version, logger  */

var fs = require('fs'),
    domain = require('domain'),
    renderer = require('hogan.js'),
    async = require('async'),
    util = require('./teo.utils'),
    Base = require('./teo.base'),
    Client = require( './teo.client'),
    AppCache = require('./teo.app.cache'),
    Middleware = require("./teo.middleware"),
    Db = require("./db/teo.db"),
    http = require("http");

/**
 * App
 * @extends {Base}
 * @constructor
 */
var App = Base.extend({
    cache: null,
    initialize: function(options, callback) {
        util.extend(this, {
            dir: options.dir,
            confDir: options.confDir,
            name: options.name,
            mode: options.mode,
            config: options.config  // default core config
        });

        this.cache = new AppCache();
        this._middleware = new Middleware();

        this.initApp(options, function() {
            // TODO: client instance on every call
            this.client = new Client({app: this});
            // ----
            process.nextTick(function() {
                this.emit("app:ready", this);
                util.isFunction(callback) ? callback() : null;
            }.bind(this));
        }.bind(this));
    },

    /**
     * Run required initialize methods
     * @param {Object} options
     * @param {Function} callback
     */
    initApp: function(options, callback) {
        var queue = {
            "_loadConfig": this.loadConfig.bind(this),
            "_collectExecutableFiles": ["_loadConfig", this._collectAppExecutableFiles.bind(this)],
            "_initDb": ["_collectExecutableFiles", function(callback) {
                if (this.config.get("db").enabled === true) {
                    this.initDb(callback);
                }
                else {
                    callback();
                }
            }.bind(this)]
        };

        async.auto(queue, callback);
    },

    /**
     * Config loader
     * @param {Function} callback
     * TODO AT: proper names (keys) for config
     */
    loadConfig: function( callback ) {
        fs.readdir( this.confDir, function(err, files) {
            if (err) {
                callback(err);
                return;
            }

            var filesCount = files.length,
                cbCount = 0;

            if ( filesCount ) {
                for ( var f in files ) {
                    var file = files[ f ],
                        confFile = this.confDir + '/' + file;
                    if ( confFile.indexOf( '.js' ) !== -1 ) {
                        this.getScript( confFile, function( err, context ) {
                            this.cache.add(confFile, context);
                            this.applyConfig( context );
                            if (( ++cbCount >= filesCount ) && callback ) {
                                callback(null, this.config);
                            }
                        }.bind(this));
                    } else if (( ++cbCount >= filesCount ) && callback )
                        callback(null, this.config);
                }
            } else
                callback();
        }.bind( this ));
    },
    /**
     * Synchronous loading of config
     * @returns {Object}
     */
    loadConfigSync: function() {       // currently only one config file will be saved TODO: multiple config files
        var files = fs.readdirSync( this.confDir ) || [],
            filesCount = files.length;

        if ( filesCount )
            for ( var f in files ) {
                var file = files[ f ],
                    confFile = this.confDir + '/' + file;
                if ( confFile.indexOf( '.js' ) !== -1 ) {
                    // TODO: read file
                    var key = file.replace( '.js', '' );
                    this.applyConfig(this.getScript( confFile ));
                }
            }
        return this.config;
    },
    /**
     * Script getter
     * @param {String} filePath :: absolute path to file
     * @param {Function} [callback]
     * @returns {*}
     */
    getScript: function(filePath, callback) {
        var context = this.cache.get(filePath),
            callback = callback || function() {};
        if (context) {
            callback(null, context);
            return context;
        }
        try {
            context = require(filePath);
            callback(null, context);
        } catch(e) {
            callback(e);
        }
        return context;
    },

    /**
     * Script runner
     * @param {String} fileName
     * @param {Array} args :: arguments to pass to file
     * @param {Function} callback
     */
    runScript: function(fileName, args, callback) {
        this.getScript(fileName, function(err, script) {
            if (err) {
                logger.error(err.message);
                callback();
                return;
            }
            if (typeof script !== "function") {
                logger.error("Trying to run not a script");
                callback(err, script);
                return;
            }
            var d = domain.create(); // TODO AT: Domains
            var self = this;
            d.on("error", function(err) {
                logger.error("Domain error", err);
            });
            d.run(function() {
                script.apply(self, args);
                callback();
            });
        }.bind(this));
    },

    /**
     * Runs model script
     * @param {String} fileName
     * @param {Function} callback
     * TODO: tests
     */
    runModel: function(fileName, callback) {
        if (!this._canUseDb()) {
            logger.warn("Cannot run model " + fileName + ", as DB usage is disabled in config, or ORM wasn't initialized properly.");
            callback();
            return;
        }
        this.getScript(fileName, function(err, collection) {
            if (err) {
                logger.error(err.message);
                callback(err, collection);
                return;
            }
            if (!(collection instanceof Object)) {
                logger.error("Trying to run not an object as model");
                callback(err, collection);
                return;
            }
            var d = domain.create();
            d.on("error", function(err) {
                logger.error("Domain error", err);
            });
            d.run(function() {
                this.db.getOrm().getAdapter().addCollection(collection);
                callback();
            }.bind(this));
        }.bind(this));
    },

    /**
     * Apply config
     * @param {Object} conf
     */
    applyConfig: function( conf ) {
        var app = this,
            config = ( typeof conf === 'object' ? conf : {} );

        this.config = this.config || {};

        util.extend(this.config, config);

        /**
         * Getter of config by mode ( development or production )
         * @returns {*}
         */
        this.config.get = function( key ) {
            // try to get app mode config key, otherwise, try to get default or common value
            return app.config[ app.mode ] && app.config[ app.mode ][key] || app.config[key];
        };
    },

    /**
     * Collect all executable files for the app
     * @param {Function} callback
     * @private
     */
    _collectAppExecutableFiles: function(callback) {
        var queue = {
            // collect files in app directories (models, controllers)
            "_readDirs": this._readAppDirs.bind(this),
            // collect other executable files set in config (appFiles)
            "_readFiles": ["_readDirs", this._readAppFiles.bind(this)]
        };

        async.auto(queue, callback);
    },

    /**
     * Read app directories, and find executable files
     * @param {Function} callback
     * @private
     */
    _readAppDirs: function(callback) {
        var dirs = this.config.get("appDirs");
        var functs = util.map(dirs, function(currentDir) {
            return async.apply(this.__collectAppDirFiles.bind(this), this.dir + '/' + currentDir);
        }.bind(this));

        async.series(functs, callback);
    },

    /**
     * Reads other executable files, provided in config (e.g. app.js)
     * @param {Function} callback
     * @private
     */
    _readAppFiles: function(callback) {
        var files = this.config.get("appFiles");
        var functs = util.map(files, function(file) {
            return async.apply(this.__loadFile.bind(this), this.dir + "/" + file);
        }.bind(this));

        async.series(functs, callback);
    },

    /**
     * Collects found executable files in provided directory
     * @param {String} dir
     * @param {Function} callback
     * @private
     */
    __collectAppDirFiles: function(dir, callback) {
        fs.readdir(dir, function(err, files) {
            if (err) {
                logger.error(err);
                callback(err);
                return;
            }
            if (!files.length) {
                callback(null);
                return;
            }
            var functs = util.map(files, function(file) {
                return async.apply(this.__loadFile.bind(this), dir + "/" + file);
            }.bind(this));

            async.series(functs, callback);
        }.bind( this ));
    },

    /**
     * Loads file into the system
     * @param {String} path
     * @param {Function} callback
     * @private
     */
    __loadFile: function(path, callback) {
        fs.lstat(path, function(err, stat) {
            if (err) {
                callback(err);
                return;
            }
            if (!stat.isFile()) {
                callback("Not a file was found!");
            }
            this.getScript(path, function(err, context) {
                if (err) {
                    logger.error(err);
                    callback(err);
                    return;
                }
                this.cache.add(path, context);   // TODO: refactor
                callback(null, path);
            }.bind(this));
        }.bind(this));
    },

    /**
     * Init database
     * @param callback
     */
    initDb: function(callback) {
        try {
            this.db = new Db(this.config.get("db"));
            callback();
        } catch (err) {
            logger.error(err);
            callback(err);
            throw err;
        }
    },

    /**
     * Run previously loaded app's scripts
     * @param {Function} callback
     */
    runAppScripts: function(callback) {
        var scripts = Object.keys(this.cache.get("*")),
            functs;

        functs = util.map(scripts, function(scriptPath) {
            //  TODO: should dynamically check with config for allowed directories or files (appDirs, appFiles) to run
            return async.apply(function(script, next) {
                if (script.match(/\/controllers\//)) {
                    this.runScript(script, [this.client.routes, (this._canUseDb() && this.db.getOrm() || undefined)], next); // pass app, and client APIs as arguments
                }
                else if (script.match(/\/models\//)) {
                    this.runModel(script, next);
                }
                else { // TODO: do allow execute other scripts?
                    this.runScript(script, [this.client.routes, (this._canUseDb() && this.db.getOrm() || undefined)], next); // pass app, and client APIs as arguments
                }
            }.bind(this), scriptPath);
        }.bind(this));

        async.series(functs, callback);
    },

    /**
     * Start app server
     * @param {Function} callback
     */
    start: function(callback) {
        var functs = [];

        functs.push(
            // scripts should be run before db is connected (as models should be collected as well)
            async.apply(this.runAppScripts.bind(this)),
            async.apply(this._connectOrm.bind(this)),
            async.apply(function(next) {
                var withListen = true;
                this.initServer(withListen);
                this.server.once("listening", next.bind(this, null, this));
            }.bind(this))
        );

        async.series(functs, callback);
    },

    /**
     * Inits server
     * @param {Boolean} withListen :: immediately listen to server
     */
    initServer: function(withListen) {
        this.server = http.createServer(this.getDispatcher());
        if (withListen) {
            this.listenServer();
        }
    },

    /**
     * Start listening of server
     */
    listenServer: function() {
        this.server && this.server.listen(this.config.get("port"), this.config.get("host"));
    },

    /**
     * Stops server
     * @param {Function} callback
     * TODO: disconnect DB
     */
    stop: function(callback) {
        var config = this.config,
            callback = util.isFunction(callback) ? callback : function() {};
        if (this.server) {
            try {
                this.server._connections = 0;
                this.server.close(function () {
                    logger.info("Connection closed, port: " + config.get("port") + " host: " + config.get("host"));
                    callback();
                });
            } catch (e) {
                callback(e);
            }
        }
        else {
            callback();
        }
    },

    /**
     * Dispatcher getter
     * @returns {*|function(this:App)}
     */
    getDispatcher: function() {
        return this._createContext();
    },

    /**
     * Middleware wrapper
     * @param {Function} func
     */
    middleware: function(func) {
        this._middleware.add(func);
    },

    /**
     * Creates new context for handling requests
     * @returns {function(this:App)}
     * @private
     */
    _createContext: function() {
        return function(req, res) {
            var client = new this.client.Factory({req: req, res: res});
            if (this._middleware.count() > 0) {
                this._middleware.run(client.req, client.res, function() {
                    client.process.apply(client, arguments);
                });
            }
            else {
                client.process();
            }
        }.bind(this);
    },

    /**
     * Connects created earlier ORM
     * @param {Function} callback
     * @private
     */
    _connectOrm: function(callback) {
        if (!this._canUseDb()) {
            callback();
            return;
        }
        this.db.connect(function (err) {
            if (err) {
                logger.error(err);
                callback(err);
                throw err;
            }
            else {
                callback();
            }
        }.bind(this));
    },

    /**
     * Check if DB can be used
     * @returns {boolean}
     * @private
     */
    _canUseDb: function() {
        return (this.config.get("db").enabled === true) && this.db;
    }
});

exports = module.exports = App;