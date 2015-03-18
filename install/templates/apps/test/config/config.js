module.exports = {
    "production": {       // production
        protocol: "http",
        host: "localhost",
        port: 3000,
        cache: {
            "static": true,     // cache static files
            "response": true    // cache response by url
        }
    },
    "development": {
        protocol: "http",
        host: "localhost",
        port: 3100,
        cache: {
            "static": false,
            "response": false
        }
    },
    // common params could be without mode as well
    delimiters: '{{ }}',
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
    }
};