/*!
 * Teo.js Core spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/17/14
 * TODO: start, restart, stop
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */
// TODO: can add more specific tests of core properties, like core config etc.
var Core = require(teoBase + '/teo.core');

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
        core = new Core(params, function() {
            done();
        });
    });
    afterEach(function() {
        core = null;
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
            done();
        });
    });

    it("Should stop apps", function(done) {
        core.stop(function(err) {
            done(err);
        });
    });
});