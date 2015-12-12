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
    Modules = require("./teo.modules"),
    configLib = require("../lib/config");

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

    applyConfig(config) {
        this.initialConfig = config;
    }

    * initApp() {
        this.loadConfig();
        this.initDb();
        this._initExtensions();

        // init modules
        yield* this._initModules();
    }

    /**
     * Loads app's config
     */
    loadConfig() {
        // set node config dir to app's home dir
        this.config = configLib.loadConfig(this.initialConfig.confDir);
        // node-config get function
        let nodeConfigGetter = this.config.get.bind(this.config);
        // wrap with it's own get
        this.config.get = (key) => {
            // firstly, find it in the pure js object (initial config), which is passed in the app's constructor
            if (this.initialConfig.hasOwnProperty(key)) {
                return this.initialConfig[key];
            }
            // then try to find it in app's config
            if (this.config.has(key)) {
                return nodeConfigGetter(key);
            }
            // otherwise, look into core config, to get default value
            else if (this.initialConfig.hasOwnProperty("coreConfig") && this.initialConfig.coreConfig.has(key)) {
                return this.initialConfig.coreConfig.get(key);
            }
        };
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

    // ---- ----

    * _readAppDirs() {
        let dirs = this.config.get("appDirs") || [];
        let l = dirs.length;

        for (let i = 0; i < l; i++) {
            let currentDir = dirs[i];
            yield* this.__collectAppDirFiles(path.join(this.config.get("appDir"), currentDir));
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
             let file = path.join(this.config.get("appDir"), files[i]);
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
        // TODO: mount this.runAppFiles(); this.runModules();
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
        this.extensions = new Extensions(this.config);
    }

    * _runExtensions() {
        let context = this;
        yield* this.extensions.runAll(context);
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

    get name() {    // TODO: rename to appName
        return this.config.get("name");
    }
}

module.exports = App;