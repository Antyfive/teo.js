// framework's main config
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    server: {
        keyPath: "",
        certPath: ""
    },
    appFiles: ["app.js"],    // app's files to read and cache on system start
    cookie: {
        keys: ["signed key"]    // default signed key
    },
    cluster: {
        enabled: false
    },
    db: {   // example of db config
        enabled: false,
        adapterConfig: {}
    },
    templateSettings: {
        extension: "tpl",
        delimiters: "{{ }}",
        engine: "hogan",
        cache: false
    }
};