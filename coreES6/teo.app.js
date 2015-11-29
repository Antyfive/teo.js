/*!
 * Teo.js App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

"use strict";

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
    Db = require("./db/teo.db"),
    Modules = require("./teo.modules");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

        this.cache = new AppCache();
        this._middleware = new Middleware();

        _.generator(function* () {
            yield* this.initApp();
            return this;
        }.bind(this), this.callback);
    }

    * initApp() {
        yield* this.loadConfig();
        this.initDb();
        this._initExtensions();

        // init modules
        yield* this._initModules();
    }

    * loadConfig() {
        let configFiles = yield _.thunkify(fs.readdir)(this.config.confDir);
        let filesCount = configFiles.length;

        if (filesCount > 0) {
            for (let f in configFiles) {
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
        let context = this.cache.get(filePath);
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

        for (let i = 0; i < l; i++) {
            let currentDir = dirs[i];
            yield* this.__collectAppDirFiles(path.join(this.config.appDir, currentDir));
        }
    }

    * __collectAppDirFiles(dir) {
        let files = yield _.thunkify(fs.readdir)(dir);
        let l = files.length;

        for (let i = 0; i < l; i++) {
            let file = path.join(dir, files[i]);
            yield* this.__loadFile(file);
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

         for (let i = 0; i < l; i++) {
             let file = path.join(this.config.appDir, files[i]);
             yield* this.__loadFile(file);
         }
    }

    // ---- ----

    * start() {
        yield* this._runExtensions();
        yield* this.connectDB();

        yield* this.initServer();

        let args = [this, Client.routes];

        if (this._canUseDb()) {
            args.push(this.db.getOrm().getAdapter().addCollection.bind(this.db.getOrm().getAdapter()));
        }
        this._modules.runMountedModules.apply(this._modules, args);   // TODO: run models
    }

    * stop() {
        yield* this.closeServer();
        yield* this.disconnectDB();
    }

    * restart() {
        yield* this.closeServer();
        yield* this.disconnectDB();
        yield* this.start();
    }

    // ---- ----

    /**
     * Inits server
     */
    * initServer() {
        this.server = http.createServer(this.getDispatcher());

        yield function(callback) {
            this.server.listen(this.config.get("port"), this.config.get("host"), callback);
        }.bind(this);
    }

    * closeServer() {
        logger.info(`Closing ${this.name} app server.`);

        yield function(callback) {
            this.server.close(() => {
                logger.info(`Connection closed, port: ${this.config.get("port")} host: ${this.config.get("host")}`);
                callback();
            });
        }.bind(this);
    }

    getDispatcher() {
        return this._createContext();
    }

    _createContext() {
        return (req, res) => {
            let client = Client.Factory({
                req: req,
                res: res,
                config: this.config
            });
            this._middleware.run(this.respond, client).catch((error) => {
                logger.error(error);
                client.res.send(500);
            });
        };
    }

    * respond(next) {
        yield* next;        // run chain of middleware functions
        yield* this.process();     // client.process
    }

    // ---- ----

    _canUseDb() {
        return (this.config.get("db").enabled === true) && this.db;
    }

    * connectDB() {
        if (!this._canUseDb()) {
            return;
        }

        yield* this.db.connect();
    }

    * disconnectDB() {
        if (this._canUseDb() && this.db.connected()) {
            yield* this.db.disconnect();
        }
    }

    _initExtensions() {
        this.extensions = new Extensions(_.extend({app: this}, this.config.get("extensions")));
    }

    * _runExtensions() {
        yield* this.extensions.runAll();
    }

    * _initModules() {
        this._modules = new Modules({
            config: this.config
        });

        yield* this._modules.collect();
        this._modules.mountModules(this);
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