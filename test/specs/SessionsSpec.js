/* global define, describe, beforeEach, afterEach, it, assert, sinon  */

/*!
 * Sessions tests
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/6/14
 */

var App = require(teoBase + '/teo.app'),
    Session = require(teoBase + '/teo.client.session'),
    request = require("supertest");

describe('Testing Sessions', function() {
    var session,
        app,
        appDir = process.cwd().replace( /\\/g, '/') + '/apps/test',
        params = {
            'appsDir': '../' + appDir,
            'confDir': appDir + '/config',
            'dir': appDir,
            'mode': 'development'
        },
        req,
        res;

    beforeEach(function(done) {
        var callback = function() {
            app.initServer();
            app.server.on("listening", function() {
                app.client.routes.get("/aa", function(_req, _res) {
                    req = _req;
                    res = _res;
                    session = new Session({req: req, res: res});
                    done();
                });
                request(app.server)
                    .get('/aa')
                    .end(function() {});
            });
            app.listenServer();
        };
        app = new App(params, callback);
    });

    afterEach(function(done) {
        app.stop(function() {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('okay');
            res = null;
            req = null;
            session = null;
            app = null;
            done();
        });
    });

    it('Should get loaded memory storage', function() {
        var storage = session.getStorage();

        assert.isTrue(storage instanceof Object, "Storage should be an object");

        assert.isFunction(storage.get, "Storage should have getter method");
        assert.isFunction(storage.set, "Storage should have setter method");

    });

    it("Should save value to the session", function() {
        req.session.set("test", "value");

        assert.equal(req.session.get("test"), "value", "Value should be returned from storage");
    });

    it("Should start new session", function() {
        var _session = session.start({req: req, res: res});

        assert.isObject(_session, "An object should be returned on session start");
        assert.isFunction(_session.get, "Getter should be returned as method");
        assert.isFunction(_session.set, "Setter should be returned as method");
    });

});