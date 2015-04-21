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
        var functs = [];

        functs.push(this.loadConfig.bind(this));

        if (!options.coreApp) {
            functs.push(this.collectAppFiles.bind(this));
            functs.push(this.initOrm.bind(this));
        }

        async.series(functs, callback);
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
    getScript: function( filePath, callback ) {
        var context = this.cache.get( filePath ),
            callback = callback || function(){};
        if ( context ) {
            callback( null, context );
            return context;
        }
        try {
            context = require( filePath );
            callback( null, context );
        } catch( e ) {
            callback( e );
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
                this.orm.getAdapter().addCollection(collection);
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
     * Serve of static files
     * @param {String} path :: path to static
     * @param {Function} callback
     */
    serveStatic: function( path, callback ) {
        var path = String( path ),
            absPath = this.dir + path,
            cached = this.cache.get( absPath ),
            self = this;

        if ( cached != null ) {
            callback( null, absPath, cached );
        } else {
            fs.exists( absPath, function( exists ) {
                if ( exists ) {
                    fs.readFile( absPath, function( err, data ) {
                        if ( err ) {
                            logger.error(err.message);
                            callback( err.message, absPath );
                        } else {
                            if (self.config.get("cache").static === true) { // add to cache, if file exists
                                self.cache.add(absPath, data);
                            }
                            callback( null, absPath, data );
                        }
                    });
                } else {
                    callback( 'Error 404: Requested file does not exists', absPath );
                }
            });
        }
    },
    /**
     * Simple renderer
     * @param {String} templateName
     * @param {Object} context
     * @param {Function} callback
     */
    render: function( templateName, context, callback ) { // TODO AT: temporal solution get rid of this
        this.serveStatic('/views/' + templateName + '.template', function( err, absPath, res ) {
            if ( err ) {
                callback( err );
                return;
            }
            var partial = context.partial || {};
            delete context.partial;
            // copyright
            context.copyright = copyright;
            context.version = version;
            var compiled  = renderer.compile( res.toString(), { delimiters:  this.config.get( 'delimiters' )}),
                output = compiled.render( context, partial );
            callback( null, output );
        }.bind( this ));
    },
    /**
     * Read all scripts, cache them and prepare to further execution
     * Currently only controllers are used
     * @param {Function} callback
     */
    collectAppFiles: function(callback) {
        var dirs = this.config.get("appDirs") || [], // TODO AT: check if not js script - than just read, add to cache and do not exec.
            files = this.config.get("appFiles") || [],
            functs = [],
            self = this;

        dirs.forEach( function( d ) {
            functs.push( function( next ) {
                fs.readdir( self.dir + '/' + d , function( err, files ) {
                    if (err) {
                        logger.error(err.message);
                        next(err);
                        return;
                    }
                    if (!files.length) {
                        next(null);
                        return;
                    }
                    var functs = [];
                    files.forEach(function(f) {      // TODO: new series here (!)
                        !function(f) {
                            functs.push( function(next) {
                                var item = self.dir + '/' + d + '/' + f;
                                fs.lstat(item, function(err, stat) {
                                    if (err) {
                                        next(err);
                                        return;
                                    }
                                    if (!stat.isFile()) {
                                        next("Not a file was found!");
                                    }
                                    self.getScript(item, function(err, context) {
                                        if (err) {
                                            next(err);
                                            return;
                                        }
                                        self.cache.add(item, context);   // TODO: refactor
                                        next(null, item);
                                    });
                                });
                            });
                        }.bind(this)(f);
                    }.bind(this));
                    async.series(functs, next);
                }.bind( this ));
            });
        });

        files.forEach(function(file) {
                functs.push(function(next) {
                    !function(file) {
                        var file = self.dir + "/" + file;
                        fs.lstat(file, function(err, stat) {
                            if (err) {
                                logger.error(err);
                                next(null, err);
                                return;
                            }
                            if (!stat.isFile()) {
                                logger.error('Error: not a file was found!');
                                next(null);
                            }
                            self.getScript(file, function(err, context) {
                                if (err) {
                                    next(err);
                                    return;
                                }
                                self.cache.add(file, context);
                                next(null, file);
                            });
                        });
                    }(file);
                }.bind(this));
        });

        async.series(functs, callback);
    },

    /**
     * Creates new ORM instance
     * @param {Function} callback
     */
    initOrm: function(callback) {
        if (!this.config.get("db").enabled) {
            callback();
            return;
        }
        var Orm,
            // TODO: all orms should be moved to separate packages after plugin system
            ormName = "./db/orm/teo.db.orm." + this.config.get("db").ormName;
        try {
            Orm = require(ormName);
            this.orm = new Orm(this.config.get("db"));
            callback();
        } catch(e) {
            logger.error(e);
            callback(e);
            throw e;
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
            return async.apply(function(script, next) {
                if (script.match(/\/controllers\//)) {
                    this.runScript(script, [this.client.routes, this.orm], next); // pass app, and client APIs as arguments

                }
                else if (script.match(/\/models\//)) {      // TODO: improve
                    //if (this.config.get("db").enabled) {
                    //    this.runModel(script, next);
                    //}
                    //else {  // continue chain
                        next();
                    //}
                }
                else { // TODO: do allow execute other scripts?
                    this.runScript(script, [this.client.routes, this.orm], next); // pass app, and client APIs as arguments
                }
            }.bind(this), scriptPath);
        }.bind(this));

        async.series(functs, callback);
    },

    /**
     * Collects app models
     * @param {Function} callback
     */
    collectAppModels: function(callback) {
        var scripts = Object.keys(this.cache.get("*"));
        var functs = [];

        util.each(scripts, function(scriptPath) {
            if (scriptPath.match(/\/models\//))
            functs.push(async.apply(function(script, next) {
                    this.runModel(script, next);
            }.bind(this), scriptPath));
        }.bind(this));

        async.series(functs, callback);
    },

    start: function(callback) {
        var functs = [];
        if ((this.config.get("db").enabled === true) && this.orm) {
            // run models
            functs.push(this.collectAppModels.bind(this), function(next) {
                this.orm.connect(function(err) {
                    if (err) {
                        logger.error(err);
                        next(err);
                        throw err;
                    }
                    else {
                        next();
                    }
                }.bind(this));
            }.bind(this))
        }

        functs.push.apply(functs, [
            async.apply(this.runAppScripts.bind(this)),
            async.apply(function(next) {
                var withListen = true;
                this.initServer(withListen);
                this.server.once("listening", next.bind(this, null, this));
            }.bind(this))
        ]);

        async.series(functs, callback);
    },

    initServer: function(withListen) {
        this.server = http.createServer(this.getDispatcher());
        if (withListen) {
            this.listenServer();
        }
    },

    listenServer: function() {
        this.server && this.server.listen(this.config.get("port"), this.config.get("host"));
    },

    stop: function(callback) {
        var config = this.config;
        if (this.server) {
            try {
                this.server._connections = 0;
                this.server.close(function () {
                    logger.info('Connection closed, port: ' + config.get('port') + ' host: ' + config.get('host'));
                    callback && callback();
                });
            } catch (e) {
                callback && callback(e);
            }
        }
        else {
            callback && callback();
        }
    },

    getDispatcher: function() {
        return this._createContext();
    },

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
     * Middleware wrapper
     * @param {Function} func
     */
    middleware: function(func) {
        this._middleware.add(func);
    }
});

exports = module.exports = App;