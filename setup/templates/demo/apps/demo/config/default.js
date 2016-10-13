/*!
 * Default config
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/5/15
 */

module.exports = {
    server: {
        protocol: "http",
        host: "localhost",
        port: 3100,
        // in case of HTTPS
        keyPath: "",
        certPath: ""
    },
    templateSettings: {
        extension: "template",
        delimiters: '{{ }}'
    }
};