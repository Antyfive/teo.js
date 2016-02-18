/*!
 * Default config
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */

module.exports = {
    // common params could be without mode as well
    templateSettings: {
        extension: "template",
        delimiters: '{{ }}'
    },
    compressOutput: true,
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
    appDirs: ["models", "controllers"], // app's directories to read and collect files inside, on system start
    appFiles: ["app.js"]   // app's files to read and cache on system start
};