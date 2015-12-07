/*!
 * Production configuration example
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */

module.exports = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    cache: {
        "static": true,     // cache static files
        "response": true    // cache response by url
    }
};