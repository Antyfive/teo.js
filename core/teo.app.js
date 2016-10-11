/*!
 * Teo.JS App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

"use strict";

const
    fs = require("fs"),
    path = require("path"),
    co = require("co"),
    Base = require("teo-base"),
    _ = require("../lib/utils"),
    Client = require("./teo.client"),
    Middleware = require("./teo.middleware"),
    Extensions = require("./teo.app.extensions"),
    Db = require("teo-db"),
    Modules = require("./teo.modules"),
    configLib = require("../lib/config"),
    serverProvider = require("./teo.server.provider");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

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

        if (this.initialConfig.coreApp === true) {
            return;
        }

        this.initDb();
        this._initExtensions();
        // init app.js
        yield* this._readAppFiles();
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
        try {
            return require(filePath);
        } catch(e) {
            logger.error(e);
            throw e;
        }
    }

    // ---- ----

    * __loadFile(filePath) {
        let stat = yield _.thunkify(fs.lstat)(filePath);

        if (!stat.isFile()) {
            throw new Error("Not a file was found!");
        }

        return this._getScript(filePath);
    }

    // ----

     * _readAppFiles() {
         let files = this.config.get("appFiles");
         let l = files.length;

         for (let i = 0; i < l; i++) {
             let file = path.join(this.config.get("appDir"), files[i]);

             try {
                 let script = yield* this.__loadFile(file);
                 script.call(this, this);
             } catch(e) {
                 logger.error(e);
             }
         }
    }

    // ---- ----

    * start() {
        yield* this.runExtensions();

        yield* this.initServer();

        // initial arguments for module mounter lib
        let args = [this, Client.routes];   // default calling arguments (are passed into module router)

        if (this.canUseDb()) {
            args.push(this.db.instance.addModel.bind(this.db.instance));
        }
        this._modules.runMountedModules.apply(this._modules, args);
        // connect database when all modules are mounted, and models were collected
        yield* this.connectDB();
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
        // this.server = http.createServer(this.getDispatcher());
        this.server = yield* this.createServer(this.getDispatcher());

        yield function(callback) {
            this.server.listen(this.config.get("port"), this.config.get("host"), callback);
        }.bind(this);
    }

    * closeServer() {
        logger.info(`Closing ${this.appName} app server.`);

        yield function(callback) {
            this.server.close(() => {
                logger.info(`Connection closed, port: ${this.config.get("port")} host: ${this.config.get("host")}`);
                callback();
            });
        }.bind(this);
    }

    /**
     * Server request dispatcher getter
     * @returns {Function}
     */
    getDispatcher() {
        return (req, res) => {
            let client = this.createClientContext(req, res);
            this._middleware.run(this.respond, client).catch((error) => {
                logger.error(error);
                client.res.send(500);
            });
        };
    }

    /**
     * Creates client context for dispatching of the request
     * @param {Object} req :: Request
     * @param {Object} res :: Response
     * @returns {Function}
     */
    createClientContext(req, res) {
        return Client.Factory({
            req: req,
            res: res,
            config: this.config
        });
    }

    * respond(next) {
        yield* next;        // run chain of middleware functions
        yield* this.process();     // client.process
    }

    // ---- ----

    canUseDb() {
        return (this.config.get("db").enabled === true) && this.db;
    }

    * connectDB() {
        if (!this.canUseDb()) {
            return;
        }

        yield* this.db.connect();
        logger.success("Database connection is opened.");
    }

    * disconnectDB() {
        if (this.canUseDb() && this.db.isConnected()) {
            yield* this.db.disconnect();
            logger.success("Database connection is closed.");
        }
    }

    _initExtensions() {
        this.extensions = new Extensions(this.config);
    }

    * runExtensions() {
        let context = this;
        yield* this.extensions.runAll(context);
    }

    * _initModules() {
        this._modules = new Modules(this.config);

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

    get appName() {
        return this.config.get("appName");
    }

    /**
     * This mixin returns arguments, with which module will be mounted (index.js, router.js will receive this set of arguments)
     * @returns {Array}
     */
    mixinModuleMounterContextArguments(moduleRouterMiddleware) {
        let args = [moduleRouterMiddleware];   // default calling arguments (are passed into module router)

        if (this.canUseDb()) {
            args.push(this.db.instance);
        }

        return args;
    }

    /**
     * Creates server bases on protocol from config
     */
    * createServer(dispatcher) {
        const protocol = this.config.get("protocol");
        const server = serverProvider.getServer(protocol);

        switch (protocol) {
            case "http":
                return server.createServer(dispatcher);
            case "https":
                const serverConfig = this.config.get("server");
                if (!_.isObject(serverConfig)) {
                    throw new Error("HTTPS server config object is not set");
                }
                const keyPath = serverConfig.keyPath;
                const certPath = serverConfig.certPath;
                if (!keyPath || !certPath) {
                    throw new Error(`Not all required config properties are available. Key path: ${keyPath}; Certificate path: ${certPath}`);
                }
                const readFile = _.thunkify(fs.readFile);
                const appDir = this.config.get("appDir");
                const keyFile = yield readFile(path.join(appDir, keyPath));
                const certFile = yield readFile(path.join(appDir, certPath));

                return server.createServer({
                    key: keyFile,
                    cert: certFile
                }, dispatcher);
            default:
                return server.createServer(dispatcher);
        }
    }
}

module.exports = App;