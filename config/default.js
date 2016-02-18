/*!
 * Teo.js default config
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    //coreAppEnabled: false,  // core app for administrator purposes (in future)
    modulesDirName: "modules",
    // this module namespace will be replaced with an empty string. I.e. "http://mysite.com/index" module will be available as "http://mysite.com/" instead.
    indexPageModuleName: "index",
    appFiles: ["app.js"],    // app's files to read and run automatically on system start (before any others)
    cluster: {
        enabled: false
    },
    db: {   // example of db config
        enabled: false,
        adapterConfig: {
            /*adapterPrefix: "teo.db.adapter.",
            adapterName: "waterline",
            adapters: {
                "default": "sails-disk",
                disk: "sails-disk",
                mysql: "sails-mysql"
            },
            connections: {
                myLocalDisk: {
                    adapter: "disk"
                },
                myLocalMySql: {
                    adapter: "mysql",
                    host: "localhost",
                    database: "foobar"
                }
            }*/
        }
    },
    templateSettings: {
        extension: "tpl",
        delimiters: "{{ }}",
        engine: "hogan",
        cache: false
    },
    // Path to local extensions directory. Should be relative to the app
    localExtensionsDirPath: "/extensions",
    extensions: [
        // e.g.
        /*{
            "name": "powered-by",   // name in registry of extensions
            "module": "teo-powered-by-extension"    // npm module
            // if you want to provide your personal, local extension
            "file": "myFileName"
        },*/
    ],
    // config for streaming. (videos etc.)
    streamer: {
        // download file instead of streaming
        forceDownload: false,
        // max age for Cache-Control
        maxAge: 3600,
        cors: false,
        // (limit) server bandwidth (bytes/second). See https://www.npmjs.com/package/throttle
        throttle: false
    }
};