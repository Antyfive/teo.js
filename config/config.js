// framework's main config
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    delimiters: '{{ }}',
    compressOutput: false,
    cache: {
        static: false,     // cache static files
        response: false      // cache response by url
    },
    appDirs: ["models", "controllers"], // app's directories to read and collect files inside, on system start
    appFiles: ["app.js"],    // app's files to read and cache on system start
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
        enabled: true
    },
    db: {
        // as default adapter. it should check "./appName/db/adapters", if not found in framework
        // all adapters should be placed into separate modules, when plugin (extension system) will be presented
        // basic algorithm should work before extension system will be finished
        ormName: "waterline",
        // teo.js orm adapter
        adapterName: "teo.db.adapter.waterline",
        // Build adapter config
        adapterConfig: {
            // each teo.js ORM adapter can have each own adapters related to the particular third party ORM
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
    }
};