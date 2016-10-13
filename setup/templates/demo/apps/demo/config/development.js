/*!
 * Development configuration
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
        "static": false,
        "response": false
    }
};