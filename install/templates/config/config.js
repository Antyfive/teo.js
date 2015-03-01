// framework's main config
module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    delimiters: '{{ }}',
    compressOutput: false,
    cache: {
        "static": false,     // cache static files
        "response": false      // cache response by url
    },
    appDirs: ["models", "controllers"], // app's directories to read and collect files inside, on system start
    appFiles: ["app.js"]    // app's files to read and cache on system start
};