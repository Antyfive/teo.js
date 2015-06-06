/*!
 * Teo.js App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

const
    fs = require("fs"),
    Base = require("./teo.base"),
    _ = require("./teo.utils"),
    AppCache = require("./teo.app.cache");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

        this.cache = new AppCache();

        _.generator(function* () {
            yield _.async(this.initApp.bind(this)).catch(logger.error);
            // TODO: create client, client extensions
            return this;
        }.bind(this), this.callback);
    }

    * initApp() {
        yield _.async(this.loadConfig.bind(this)).catch(logger.error);
        yield _.async(this.collectExecutableFiles.bind(this)).catch(logger.error);
        yield _.async(this.initDb.bind(this)).catch(logger.error);
        return this;
    }

    * loadConfig() {
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
    }

    * collectExecutableFiles() {
        yield _.async(this._readAppDirs.bind(this)).catch(logger.error);
        yield _.async(this._readAppFiles.bind(this)).catch(logger.error);

        return this;
    }

    * initDb() {  // TODO
        return this;
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
        let app = this,
            config = (typeof conf === "object" ? conf : {});

        _.extend(this.config, this.config.coreConfig, config);

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
    * _readAppDirs() {
        let dirs = this.config.get("appDirs") || [];
        let l = dirs.length;

        for (var i = 0; i < l; i++) {
            let currentDir = dirs[i];
            yield _.async(this.__collectAppDirFiles.bind(this, this.config.appDir + "/" + currentDir)).catch(logger.error);
        }
    }

    * __collectAppDirFiles(dir) {
        let files = yield _.thunkify(fs.readdir)(dir);
        let l = files.length;

        for (var i = 0; i < l; i++) {
            let file = dir + "/" + files[i];
            yield _.async(this.__loadFile.bind(this, file)).catch(logger.error);
        }

        return this;
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
             let file = this.config.appDir + "/" + files[i];
             yield _.async(this.__loadFile.bind(this, file)).catch(logger.error);
         }

         return this;
    }
    // ----
    // TODO: start of app, stop
}

module.exports = App;