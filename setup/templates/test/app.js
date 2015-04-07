/*!
 * Index
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 2/24/15
 * Is used to run test app
 */

/* global logger */

var Teo = require("./core/teo"),
    app = new Teo();

app.on("ready", function() {
    // start particular app
    app.start("test", function(err, app) { // alternatively, to start all apps: app.start(function(err, apps) {})
        logger.log("Teo.js test is running. Host: " + app.config.get("host") + ", port: " + app.config.get("port"));
    });
});

// two ways to run apps of the framework:
/**
 * 1)
 * new teo().start(function(api) {  // context of the framework inside
 *
 * });
 *
 * 2)
 * var t = new teo();
 * teo.on('start', function() {})
 * teo.start();
 *
 * -----------
 * On point of creation new framework instance, all api should be ready, as well as all apps (but not started)
 **/