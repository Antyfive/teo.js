/*!
 * Config loader
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */

"use strict";

module.exports = {
    /**
     * Config loader
     * @param {String} configDir :: absoulte path to config dir
     */
    loadConfig(configDir) {
        // set config dir to /.../appHomeDir/config
        process.env.NODE_CONFIG_DIR = configDir;
        // require config
        let config = require("config");
        // delete this variable
        delete process.env.NODE_CONFIG_DIR;
        // delete config from cache. It should be reloaded for each app.
        delete require.cache[require.resolve("config")];
        // proxy some api
        return {
            get(key) {
                return config.get(key);
            },
            has(key) {
                return config.has(key);
            }
        };
    }
};