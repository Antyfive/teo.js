/*!
 * Production configuration example
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */

module.exports = {
    server: {
        protocol: "http",
        host: "localhost",
        port: 3000,
        // in case of HTTPS
        keyPath: "",
        certPath: ""
    },
    cache: {
        "static": true,     // cache static files
        "response": true    // cache response by url
    }
};