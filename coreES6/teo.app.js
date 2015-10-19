/*!
 * Teo.js App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

"use strict";

// TODO:
// stop app

const
    fs = require("fs"),
    path = require("path"),
    domain = require("domain"),
    http = require("http"),
    co = require("co"),
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    AppCache = require("./teo.app.cache"),
    Client = require("./teo.client"),
    Middleware = require("./teo.middleware"),
    Extensions = require("./teo.app.extensions"),
    Db = require("./db/teo.db");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

        this.cache = new AppCache();
        this._middleware = new Middleware();

        _.generator(function* () {
            yield _.async(this.initApp.bind(this)).catch(logger.error);
            return this;
        }.bind(this), this.callback);
    }

    * initApp() {
        yield _.async(this.loadConfig.bind(this)).catch(logger.error);
        yield _.async(this.collectExecutableFiles.bind(this)).catch(logger.error);
        this.initDb();
        this._initExtensions();
    }

    * loadConfig() {
        let configFiles = yield _.thunkify(fs.readdir)(this.config.confDir);
        let filesCount = configFiles.length;

        if (filesCount > 0) {
            for (var f in configFiles) {
                let file = configFiles[f],
                    confFile = path.join(this.config.confDir, file);

                if (confFile.indexOf(".js") !== -1) {
                    let config = this._getScript(confFile);
                    this._applyConfig(config);
                }
            }
        }

        return this.config || {};
    }

    * collectExecutableFiles() {
        yield _.async(this._readAppDirs.bind(this)).catch(logger.error);
        yield _.async(this._readAppFiles.bind(this)).catch(logger.error);
    }

    initDb() {
        if (this.config.get("db").enabled === false) {
            return;
        }
        try {
            this.db = new Db(this.config.get("db"));
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    // ---- ----

    _getScript(filePath) {
        var context = this.cache.get(filePath);
        if (context) {
            return context;
        }
        try {
            context = require(filePath);
        } catch(e) {
            logger.error(e);

            throw new Error(e);
        }
        return context;
    }

    _applyConfig(conf) {
        let app = this,
            config = (typeof conf === "object" ? conf : {});

        this.config = _.omit(_.extend(this.config.coreConfig || {}, this.config, config), ["coreConfig"]);

        /**
         * Getter of config by mode ( development or production )
         * @returns {*}
         */
        this.config.get = function(key) {
            let config = app.config;
            // try to get app mode config key, otherwise, try to get default or common value
            return config[config.mode] && config[config.mode][key] || config[key];
        };
    }

    // ---- ----

    * _readAppDirs() {
        let dirs = this.config.get("appDirs") || [];
        let l = dirs.length;

        for (var i = 0; i < l; i++) {
            let currentDir = dirs[i];
            yield _.async(this.__collectAppDirFiles.bind(this, path.join(this.config.appDir, currentDir))).catch(logger.error);
        }
    }

    * __collectAppDirFiles(dir) {
        let files = yield _.thunkify(fs.readdir)(dir);
        let l = files.length;

        for (var i = 0; i < l; i++) {
            let file = path.join(dir, files[i]);
            yield _.async(this.__loadFile.bind(this, file)).catch(logger.error);
        }
    }

    * __loadFile(filePath) {
        let stat = yield _.thunkify(fs.lstat)(filePath);

        if (!stat.isFile()) {
            throw new Error("Not a file was found!");
        }

        let script = this._getScript(filePath);
        this.cache.add(filePath, script);

        return script;
    }

    // ----

     * _readAppFiles() {
         let files = this.config.get("appFiles");
         let l = files.length;

         for (var i = 0; i < l; i++) {
             let file = path.join(this.config.appDir, files[i]);
             yield _.async(this.__loadFile.bind(this, file)).catch(logger.error);
         }
    }

    // ---- ----

    * start() {
        yield _.async(this._runExtensions.bind(this));
        yield _.async(this._runAppScripts.bind(this));
        yield _.async(this._connectOrm.bind(this));

        var withListen = true;
        this.initServer(withListen);

        yield _.promise(function(resolve) {
            this.server.once("listening", function() {
                resolve(this);
            }.bind(this));
        }.bind(this));
    }

    * stop() {  // TODO:

    }

    * restart() {   // TODO:

    }

    // ---- ----

    /**
     * Inits server
     * @param {Boolean} withListen :: immediately listen to server
     */
    initServer(withListen) {
        this.server = http.createServer(this.getDispatcher());
        if (withListen) {
            this.listenServer();
        }
    }

    /**
     * Start listening of server
     */
    listenServer() {
        this.server && this.server.listen(this.config.get("port"), this.config.get("host"));
    }

    getDispatcher() {
        return this._createContext();
    }

    _createContext() {
        return function(req, res) {
            var client = Client.Factory({req: req, res: res, app: this});   // as for now, pass hole app
            this._middleware.run(this.respond, client).catch(function(error) {
                logger.error(error);
                client.res.send(500);
            });
        }.bind(this);
    }

    * respond(next) {
        yield *next;        // run chain of middleware functions
        this.process();     // client.process
    }

    // ---- ----

    * _runAppScripts() {
        let scripts = Object.keys(this.cache.get("*")),
            l = scripts.length;

        for (var i = 0; i < l; i++) {
            let script = scripts[i];
            // TODO: improve
            if (script.match(/\/controllers\//)) {
                yield _.async(this._runController.bind(this, script, [Client.routes, ((this._canUseDb() && this.db.getOrm() || undefined))]));
            }
            else if (script.match(/\/models\//)) {
                yield _.async(this._runModel.bind(this, script));
            }
            else { // TODO: do allow execute other scripts?
                yield _.async(this._runController.bind(this, script, [Client.routes, ((this._canUseDb() && this.db.getOrm() || undefined))]));
            }
        }
    }

    * _runController(fileName, args) {
        let script = this._getScript(fileName);

        if (!_.isFunction(script)) {
            throw new Error("Trying to run not a function! File path: " + fileName);
        }

        let d = domain.create();

        d.on("error", function(err) {
            logger.error("Domain error", err);
        });

        yield _.promise(function(resolve) {
            d.run(function() {
                script.apply(this, args);
                resolve();
            }.bind(this));
        }.bind(this));
    }

    * _runModel(model) {
        if (!this._canUseDb()) {
            logger.warn("Cannot run model " + model + ", as DB usage is disabled in config, or ORM wasn't initialized properly.");
            return;
        }

        let collection = this._getScript(model);

        if (!(collection instanceof Object)) {
            throw new Error("Trying to run not an object as model: " + model);
        }

        var d = domain.create();

        d.on("error", function(err) {
            logger.error("Domain error", err);
        });

        yield _.promise(function(resolve) {
            d.run(function() {
                this.db.getOrm().getAdapter().addCollection(collection);
                resolve();
            }.bind(this));
        }.bind(this));
    }

    _canUseDb() {
        return (this.config.get("db").enabled === true) && this.db;
    }
    // TODO: block ---- ----

    * _connectOrm() {
        if (!this._canUseDb()) {
            return;
        }

        yield _.async(this.db.connect.bind(this.db)).catch(function(err) {
            logger.error(err);
            throw err;
        });

    }

    _initExtensions() {
        this.extensions = new Extensions(_.extend({app: this}, this.config.get("extensions")));
    }

    * _runExtensions() {
        yield _.async(this.extensions.runAll.bind(this.extensions));
    }

    /**
     * Middleware wrapper
     * @param {Function} func
     */
    middleware(func) {
        this._middleware.add(func);
    }

    // getters & setters ----

    get name() {
        return this.config.name;
    }
}

module.exports = App;