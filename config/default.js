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
    db: {
        enabled: false,
        adapterConfig: {
            // example of the config for local adapter file
            //adapterName: "teo.db.adapter.waterline",
            //adapterPath: "/absolute/path/to/adapter/directory",
            //adapterPrefix: "teo.db.adapter.",
            //adapterModule: "teo-db-adapter-waterline",
            /*waterlineAdapters: {
                "default": require("sails-disk"),
                disk: require("sails-disk")
                //mysql: "sails-mysql"
            },*/
            /*connections: {
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
            "file": "myFileName",
            config: {myParam: true} // extensions' configuration. Will be passed to the extension, as a second argument
        },*/
    ]
};