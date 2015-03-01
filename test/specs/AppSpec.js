/*!
 * Teo.js App Spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/17/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

// TODO: cover with tests other methods of the App class
var App = require(teoBase + '/teo.app'),
    http = require("http");

describe('Testing App', function() {
    var app,
        appDir = process.cwd().replace( /\\/g, '/') + '/apps/test',
        params = {
            'appsDir': '../' + appDir,
            'confDir': appDir + '/config',
            'dir': appDir,
            'mode': 'development'
        },
        initSpy;

    beforeEach(function(done) {
        initSpy = sinon.spy();
        app = new App(params, function() {
            initSpy(); done();
        });
    });

    afterEach(function() {
        initSpy = null;
        app = null;
    });

    it('Should call callback after initialisation', function() {
        assert.equal(initSpy.calledOnce, true, 'Callback should be called after initialise.');
    });

    it('Should have cache initialised', function() {
        assert.equal((app.cache.get('*') instanceof Object), true, 'Cache object should be created.');
    });

    it('Should load config file synchronously', function() {
        var applyConfigSpy = sinon.spy(app, 'applyConfig');
        var config = app.loadConfigSync();

        assert.equal(applyConfigSpy.calledOnce, true, 'Loaded config should be applied to the app');
        assert.equal((config instanceof Object), true, 'Config file should be loaded in synchronous way');
        assert.equal((config.get instanceof Function), true, 'Config getter should be available');
        assert.equal(config.get('delimiters'), '{{ }}', 'Config getter should return value by key');
//        assert.equal((config.get('production') instanceof Object), true, 'Config should have production parameters');
//        assert.equal((config.get('development') instanceof Object), true, 'Config should have development parameters');
    });
    // TODO: refactor to more describes
    it('Should render output html', function(done) {
        app.render('index', {}, function(err, output) {
            assert.equal((typeof output === 'string' && err == null), true, 'Template should be rendered');
            done();
        });
    });

    it("Should create http server", function(done) {
        app.initServer();
        app.server.on("listening", function() {
            assert.isTrue(app.server instanceof http.Server, "Server property should be created and available");
            app.stop(done);
        });
        app.listenServer();
    });

    it("Should load static file without adding to cache", function(done) {
        var addToCacheSpy = sinon.spy(app.cache, "add");

        app.serveStatic("/views/index.template", function(err, absPath, data) {

            assert.isNull(err, "It should not be any error");
            assert.isFalse(addToCacheSpy.called, "Add to cache method should not be called");

            addToCacheSpy.restore();
            done();

        });
    });

    it("Should load static file with adding to cache", function(done) {

        var addToCacheSpy = sinon.spy(app.cache, "add");

        app.config.development.cache.static = true; // set to true, to allow check caching
        app.serveStatic("/views/index.template", function(err, absPath, data) {

            assert.isNull(err, "It should not be any error");
            assert.isTrue((app.cache.get(appDir + '/views/index.template') instanceof Buffer), true, 'Template buffer should be in the cache.');
            assert.isTrue(addToCacheSpy.calledOnce, "Add to cache method should be called once");

            addToCacheSpy.restore();
            // revert change
            app.config.development.cache.static = false;

            done();

        });
    });
});