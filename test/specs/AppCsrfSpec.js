/*!
 * App CSRF spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 10/26/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var App = require(teoBase + '/teo.app'),
    Csrf = require(teoBase + '/teo.client.session.csrf'),
    request = require("supertest");

describe("Testing App CSRF", function() {
    var csrf,
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
            app.initServer();           // todo: use ready req, res instead of creating server
            app.server.on("listening", function() {
                app.client.routes.get("/aa", function(_req, _res) {
                    req = _req;
                    res = _res;
                    csrf = new Csrf({req: req, res: res});
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
            csrf = null;
            app = null;
            done();
        });
    });

    it('Should generate token', function() {
        var token = csrf.genToken();
        assert.isTrue(typeof token === "string", "Token is not a string");
        assert.equal(csrf.getToken(), token, "Tokens are different");
    });

    it("Should validate token", function() {
        assert.isFalse(csrf.validate("test"), "Token not validated correctly");
    });
});