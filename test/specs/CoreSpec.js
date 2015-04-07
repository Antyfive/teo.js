/*!
 * Teo.js Core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/17/14
 * TODO: start, restart, stop
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */
// TODO: can add more specific tests of core properties, like core config etc.
var Core = require(teoBase + "/teo.core");

describe('Testing Core', function() {
    var core,
        dir = process.cwd().replace( /\\/g, '/'),
        params = {
        'appsDir': dir + '/apps',
        'confDir': dir + '/config',
        'dir': dir,
        'mode': 'development'
    };

    beforeEach(function(done) {

        // prevent message about memory leak (default max of 10 listeners or use emitter.setMaxListeners instead)
        sinon.stub(process, "on", function() {});
        sinon.stub(Core.prototype, "setupWorkersLogging", function() {});

        core = new Core(params, function() {
            done();
        });

    });

    afterEach(function() {

        core = null;
        process.on.restore();
        Core.prototype.setupWorkersLogging.restore();
        
    });

    it('Should create new core instance', function() {

        assert.equal(core instanceof Core, true, 'New core instance should be created.');

    });

    it('Should have config', function() {

        assert.equal((core._app.config instanceof Object), true, 'Core config should be available.');

    });

    it('Should prepare available apps', function(done) {

        core.prepareApps(function() {
            assert.equal(Object.keys(core.apps).length, 1, 'Core test app should be loaded');
            done();
        });

    });

    it('Should register new app', function(done) {

        core.registerApp('SecondApp', function() {

            assert.equal(Object.keys(core.apps).length, 2, 'Two apps should be loaded');
            assert.equal(core.apps.SecondApp.name, 'SecondApp', 'App should have name');

            delete core.apps.SecondApp;

            done();

        });

    });

    it("Should stop apps", function(done) {

        core.stop(function(err) {
            done(err);
        });

    });

    it("Should return app by name", function() {

        var app = core.getApp("test");

        assert.deepEqual(app, core.apps.test, "App should be returned");

    });

    describe("Testing Apps Start", function() {

        it("Should start all apps without passing a name", function(done) {

            core.start(function(err, app) {

                assert.isUndefined(err, "Error shouldn't exist");
                assert.deepEqual(core.apps.test, app[0], "App should be equal");

                core.stop(done);

            });

        });

        it("Should start single app with passed name", function(done) {

            core.registerApp("app2", function() {

                core.start("test", function(err, app) {

                    assert.isNull(err, "Error isn't null");
                    assert.deepEqual(core.apps.test, app, "App should be equal");

                    delete core.apps.app2;

                    core.stop(done);

                });

            });

        });

    });
});