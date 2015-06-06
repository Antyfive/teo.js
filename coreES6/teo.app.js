/*!
 * Teo.js App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

const Base = require("./teo.base"),
    _ = require("./teo.utils"),
    AppCache = require("./teo.app.cache");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

        this.cache = new AppCache();

        _.generator(function* () {
            yield _.async(this.initApp.bind(this));
            // TODO: create client, client extensions
            return this;
        }.bind(this), this.callback);
    }

    initApp() {
        return (function* () {
            yield _.async(this.loadConfig.bind(this));
            yield _.async(this.collectExecutableFiles.bind(this));
            yield _.async(this.initDb.bind(this));
            return this
        }.bind(this))();
    }

    loadConfig() {
        return (function* () {
            let configFiles = yield _.thunkify(fs.readdir)(this.config.confDir);
            let filesCount = configFiles.length;

            if (filesCount > 0) {
                for (var f in configFiles) {
                    let file = configFiles[f],
                        confFile = this.config.confDir + "/" + file;

                    if (confFile.indexOf(".js") !== -1) {
                        let config = this._getScript(confFile);
                        this._applyConfig(config);
                    }
                }
            }

            return this.config || {};
        }.bind(this))();
    }

    collectExecutableFiles() {
        return (function* () {
            yield _.async(this._readAppDirs.bind(this));
            yield _.async(this._readAppFiles.bind(this));
        }.bind(this))();
    }

    initDb() {  // TODO
        return (function* () {
            return this;
        }.bind(this))();
    }

    // ----
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
        var app = this,
            config = (typeof conf === "object" ? conf : {});

        this.config = this.config || {};

        _.extend(this.config, config);

        /**
         * Getter of config by mode ( development or production )
         * @returns {*}
         */
        this.config.get = function(key) {
            // try to get app mode config key, otherwise, try to get default or common value
            return app.config[app.mode] && app.config[app.mode][key] || app.config[key];
        };
    }
    // ----
    _readAppDirs() {
        return (function* () {
            let dirs = this.config.get("appDirs") || [];
            let l = dirs.length;

            for (var i = 0; i < l; i++) {
                let currentDir = dirs[i];
                yield _.async(this.__collectAppDirFiles.bind(this, this.config.appDir + "/" + currentDir));
            }
        }.bind(this))();
    }

    __collectAppDirFiles(dir) {
        return (function* () {
            let files = yield _.thunkify(fs.readdir)(dir);
            let l = files.length;

            for (var i = 0; i < l; i++) {
                let file = dir + "/" + files[i];
                yield _.async(this.__loadFile.bind(this, file));
            }

            return this;
        }.bind(this))()
    }

    __loadFile(filePath) {
        return (function* () {
            let stat = _.thunkify(fs.lstat)(filePath);

            if (!stat.isFile()) {
                throw new Error("Not a file was found!");
            }

            let script = this._getScript(filePath);
            this.cache.add(filePath, script);

            return script;
        }.bind(this))();
    }

    // ----

    _readAppFiles() {
        return (function* () {
            let files = this.config.get("appFiles");
            let l = files.length;

            for (var i = 0; i < l; i++) {
                let file = this.config.appDir + "/" + files[i];
                yield _.async(this.__loadFile.bind(this, file));
            }

            return this;
        }.bind(this))();
    }
    // ----
    // TODO: start of app, stop
}

module.exports = App;