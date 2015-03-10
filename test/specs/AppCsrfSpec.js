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
        res,
        getTokenStub, generateHashSpy, setTokenSpy;

    beforeEach(function(done) {
        var callback = function() {
            app.initServer();           // todo: use ready req, res instead of creating server
            app.server.on("listening", function() {
                app.client.routes.get("/aa", function(_req, _res) {
                    req = _req;
                    res = _res;
                    csrf = new Csrf({
                        req: req,
                        res: res,
                        config: {
                            keyName: "_csrfToken",
                            secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
                        }
                    });

                    getTokenStub = sinon.stub(csrf, "getToken");
                    generateHashSpy = sinon.spy(csrf, "generateHash");
                    setTokenSpy = sinon.spy(csrf, "setToken");

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
            getTokenStub.restore();
            generateHashSpy.restore();
            setTokenSpy.restore();
            done();
        });
    });

    it('Should generate token if it isn`t exists', function() {

        getTokenStub.returns(undefined);

        var token = csrf.genToken();

        assert.isTrue(getTokenStub.calledOnce, "Getter of token should be called");
        assert.isTrue(generateHashSpy.calledOnce, "Hash should be generated");
        assert.isTrue(setTokenSpy.calledOnce, "Setter of token should be called once");

    });

    it("Should not generate token if it exists", function() {

        generateHashSpy.reset();
        getTokenStub.returns("1");

        var token = csrf.genToken();

        assert.isTrue(getTokenStub.calledOnce, "Getter of token should be called");
        assert.isFalse(generateHashSpy.called, "Hash should not be generated");
        assert.isFalse(setTokenSpy.called, "Setter of token should be called");

        assert.isTrue(typeof token === "string", "Token is not a string");
        assert.equal(csrf.getToken(), token, "Tokens are different");

    });

    it("Should validate token", function() {

        assert.isFalse(csrf.validate("test"), "Token not validated correctly");

    });

    it("Should generate hash string", function() {

        assert.isString(csrf.generateHash(), "Hash should be generated");

    });

    it("Should set token correctly", function() {

        var token = "123";
        var cookieSetStub = sinon.stub(csrf.req.cookie, "set", function() {});
        var sessionSetStub = sinon.stub(csrf.req.session, "set", function() {});

        csrf.setToken(token);

        assert.isTrue(cookieSetStub.calledOnce, "Cookie setter should be called");
        assert.isTrue(sessionSetStub.calledOnce, "Session setter should be called");

        assert.deepEqual(cookieSetStub.args[0], [csrf.keyName, token], "Token should be passed to cookie setter");
        assert.deepEqual(sessionSetStub.args[0], [csrf.keyName, token], "Token should be passed to session setter");

        cookieSetStub.restore();
        sessionSetStub.restore();

    });

});