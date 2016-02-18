// framework's main config
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    delimiters: '{{ }}',
    cache: {
        "static": false,     // cache static files
        "response": false      // cache response by url
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
    }
};