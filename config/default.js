/*!
 * Teo.js default config
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    coreAppEnabled: false,  // core app for administrator purposes (in future)
    cache: {
        static: false,     // cache static files
        response: false      // cache response by url
    },
    // was appDirs
    modulesDirName: "modules",
    dirsInModule: ["models", "controllers"], // app's directories to read and collect files inside, on system start
    moduleEntryPoints: ["router"], // these files will be wrapped by lazy loaded (for optimization)
    appFiles: ["app.js"],    // app's files to read automatically on system start (before any others)
    cookie: {
        keys: ["signed key"]    // default signed key
    },
    session: {
        sessionKeyName: "SID",
        secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        lifetime: {
            session: 60 * 60 * 24 * 10 // in seconds, ten days by default
        },
        storageType: "memory" // only memory storage type at the moment
    },
    csrf: {
        keyName: "_csrfToken",
        secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    },
    cluster: {
        enabled: false
    },
    db: {
        enabled: false,
        // as default adapter. it should check "./appName/db/adapters", if not found in framework
        // all adapters should be placed into separate modules, when plugin (extension system) will be presented
        // basic algorithm should work before extension system will be finished
        ormName: "waterline",
        // teo.js orm adapter
        adapterName: "teo.db.adapter.waterline",
        // Build adapter config
        adapterConfig: {
            // each teo.js ORM can have each own adapters related to the particular third party ORM
            adapters: {
                // adapters should be installed as packages via npm
                "default": "sails-disk",
                disk: "sails-disk",
                mysql: "sails-mysql"
            },
            // Connections Config
            // Setup connections using the named adapter configs
            connections: {
                myLocalDisk: {
                    adapter: "disk"
                },
                myLocalMySql: {
                    adapter: "mysql",
                    host: "localhost",
                    database: "foobar"
                }
            }
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
    ]
};