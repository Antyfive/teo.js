/*!
 * Teo.js core
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {13.03.14}
 */

/* global logger */

var fs = require('fs'),
    async = require('async'),
    Compressor = require('./teo.compressor'),
    util = require('./teo.utils'),
    Base = require('./teo.base'),
    App = require('./teo.app'),
    Path = require('path');

var Core = Base.extend({
    apps: {},

    initialize: function(params, callback) {
        util.extend(this, params);
        this.bindProcessEvents();
        // mixture first core's app
        this._app = this.mixtureApp({ dir: this.appsDir, confDir: Path.normalize(__dirname + "/../config"), mode: this.mode }); // set flag, that it's core's app
        // this._app.loadConfigSync();     //  (!) load config synchronously TODO: it's not required any more
        this.prepareApps(function() {
            callback.call(this, this);
        }.bind(this));
    },

    mixtureApp: function(options) {
        return new App(options);
    },

    prepareApps: function( callback ) {
        var self = this;
        fs.readdir( this.appsDir, function( err, apps ) {
            if ( err ) {
                logger.error( err );
                callback();
                return;
            }
            var appsCount = Object.keys( apps ).length,
                cbCount = 0;

            for ( var k in apps ) {
                var app = apps[ k ],
                    appDir = this.appsDir + '/' + app,
                    stat = fs.lstatSync( appDir );
                if ( stat.isDirectory()) {
                    self.registerApp( app, function() {
                        if ( ++cbCount >= appsCount && callback )
                            callback();
                    });
                } else if ( ++cbCount >= appsCount && callback ) {
                    callback();
                    return;
                }
            }
        }.bind( this ));
    },

    registerApp: function( appName, callback ) {
        var appDir = this.appsDir + '/' + appName,
            application,
            apps = this.apps;

        application = this.mixtureApp({
            dir: appDir,
            confDir: appDir + '/config',
            name: appName,
            mode: this.mode,
            config: this._app.config
        });

        application.once('app:ready', function(app) {
            apps[appName] = app;
            callback(app);
        });

        application.on("error", function(err){
            this.exitHandler({exit: true}, err);
        }.bind(this));
    },

    start: function( callback ) {
        var functs = [];
        util.each(this.apps, function(app) {
            functs.push(app.start.bind(app));
        });
        async.series(functs, callback);
    },

    stop: function(done) {
        var functs = [];
        util.forEach(this.apps, function(app) {
            functs.push(function(next) {
                app.stop(next);
            })
        });
        functs.push(function(next) {
            this._app.stop(next);
        }.bind(this));

        async.series(functs, function(err) {
            done && done(err);
            this.exitHandler({cleanup: true});
        }.bind(this));
    },

    restart: function() {   // TODO

    },
    // getters  ----
    getApps: function() {
        return this.apps;
    },
    /**
     * Get app it's by name
     * @param {String} name
     * @returns {*}
     */
    getApp: function(name) {
        return this.apps[name];
    },
    // TODO: move to the separate module
    bindProcessEvents: function() {
        // Kill off the process
        process.on("message", function(msg) {
            if (msg.cmd && msg.cmd == "kill") {
                process.exit();
            }
        });
        // do something when app is closing
        process.on('exit', this.exitHandler.bind(null,{cleanup:true}));
        // catches ctrl+c event
        process.on('SIGINT', this.exitHandler.bind(null, {exit:true}));
        // catches uncaught exceptions
        process.on('uncaughtException', this.exitHandler.bind(null, {exit:true}));
    },

    exitHandler: function(options, err) {
        if (options.cleanup) {  // TODO: cleanup
            logger.info('cleanup');
        }
        if (err) {
            logger.error(err.message);
        }
        if (options.exit) {
            logger.info("Closing Teo.js");
            process.exit(err ? 1 : 0);
        }
    }
});

exports = module.exports = Core;