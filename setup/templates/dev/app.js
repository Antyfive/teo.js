/*!
 * Dev app
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/22/15
 */

/* global logger */

var Teo = require("teo.js"),
    app = new Teo({
        // pass dirname, in case app will be started by linux daemon, this parameter is required
        dirname: __dirname
    });

app.on("ready", function() {
    // start particular app
    app.start("dev", function(err, app) {   // alternatively, to start all apps: app.start(function(err, apps) {})
        logger.log("Teo.js is running. Host: " + app.config.get("host") + ", port: " + app.config.get("port"));
    });
});