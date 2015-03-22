/*!
 * Index
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 2/24/15
 * Used to run test app
 */

var Teo = require( './core/teo'),
    app = new Teo();

app.on('ready', function() {
    console.log("App is ready to start.");
    app.start(function(app) {
        console.log("Teo.js dev app has started");
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