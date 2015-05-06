/*!
 * App Http spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 10/19/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var App = require(teoBase + '/teo.app'),
    supertest = require("supertest");

describe("Testing App HTTP", function() {
    var app,
        appDir = process.cwd().replace( /\\/g, '/') + '/apps/test',
        params = {
            'appsDir': '../' + appDir,
            'confDir': appDir + '/config',
            'dir': appDir,
            'mode': 'development'
        },
        agent,
        token;

    beforeEach(function(done) {
        var callback = function() {
            app.initServer();
            app.server.on("listening", function() {
                app.client.routes.get("/test/route", function(req, res) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('okay');
                });
                app.client.routes.post("/test/route", function(req, res) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('okay');
                });
                app.client.routes.put("/test/route/:id", function(req, res) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('okay');
                });
                app.client.routes.delete("/test/route/:id", function(req, res) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('okay');
                });
                app.client.routes.patch("/test/route/:id", function(req, res) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('okay');
                });

                agent = supertest.agent(app.server);
                app.client.routes.get("/test/cookie", function(req, res) {
                    token = req.csrf.getToken();
                    res.end();
                });
                agent
                    .get('/test/cookie')
                    .expect(200)
                    .end(function(err, res) {
                        done(err);
                    });
            });

            app.listenServer();
        };
        app = new App(params, callback);
    });

    afterEach(function(done) {
        app.stop(function() {
            app = null;
            agent = null;
            token = null;
            done();
        });
    });

    describe("Testing HTTP", function() {
        it('Should respond OK GET with text/plain', function(done) {
            agent
                .get('/test/route')
                .expect('Content-Type', "text/plain")
                .expect(200)
                .end(function(err, res) {
                    done(err);
                });
        });

        it('Should respond OK POST with text/plain', function(done) {
            app.client.routes.get("/test/cookie", function(req, res) {
                token = req.session.csrf.getToken();
                res.end();
            });
            agent
                .get('/test/cookie')
                .expect(200)
                .end(done)
        });
        // TODO: refactor
        it("Should respond 200 to POST call with correct CSRF token", function(done) {
            agent
                .post('/test/route')
                .send({_csrfToken: token})
                .expect('Content-Type', "text/plain")
                .expect(200)
                .end(done);
        });

        it("Should respond 403 to POST call with not valid CSRF token", function(done) {
            agent
                .post("/test/route")
                .send({_csrfToken: "wrong token"})
                .expect(403)
                .end(done);
        });

        it('Should respond OK PUT with text/plain', function(done) {
            agent
                .put('/test/route/1')
                .expect('Content-Type', "text/plain")
                .expect(200)
                .end(function(err, res) {
                    done(err);
                });
        });

        it('Should respond OK DELETE with text/plain', function(done) {
            agent
                .delete('/test/route/1')
                .expect('Content-Type', "text/plain")
                .expect(200)
                .end(function(err, res) {
                    done(err);
                });
        });

        it('Should respond OK PATCH with text/plain', function(done) {
            agent
                .patch('/test/route/1')
                .expect('Content-Type', "text/plain")
                .expect(200)
                .end(function(err, res) {
                    done(err);
                });
        });

        it('Should respond 404 PATCH with text/html', function(done) {
            agent
                .patch('/test/route/2/2')
                .expect('Content-Type', "text/html")
                .expect(404)
                .end(function(err, res) {
                    done(err);
                });
        });

        it("Should return 403 for invalid token", function(done) {
            app.client.routes.post("/test/create/1", function(req, res) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('okay');
            });
            agent
                .post("/test/create/1")
                .send({_crsfToken: "fake"})
                .expect('Content-Type', "text/html")
                .expect(403)
                .end(function(err, res) {
                    done(err);
                });
        });

        it("Should end with 500 code error with invalid JSON", function(done) {
            app.client.routes.post("/test/create/2", function(req, res) {
                // callback is never executed
                res.send(200);
            });
            agent
                .post("/test/create/2")
                .set('Content-Type', 'application/json')
                .send("aaa")
                .expect(500)
                .end(done);
        });

        it("Should end with 200 code with valid JSON", function(done) {
            app.client.routes.post("/test/create/3", function(req, res) {
                res.send('okay');
            });
            agent
                .post('/test/create/3')
                .set('Accept', 'application/json')
                .send({_csrfToken: token, myField: true})
                .expect('Content-Type', /json/)
                .expect(200, { code: 200, data: 'okay', message: 'OK' })
                .end(done);
        });

        it("Should response with MIME type set in the Accept header", function(done) {
            app.client.routes.post("/test/create/4", function(req, res) {
                res.send('okay');
            });
            agent
                .post('/test/create/4')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .send({_csrfToken: token, myField: true})
                .expect('Content-Type', /json/)
                .expect(200, { code: 200, data: 'okay', message: 'OK' })
                .end(done);
        });

        it("Should response with text/html when sending error code", function(done) {
            app.client.routes.get("/test/create/5", function(req, res) {
                res.send(404);
            });
            agent
                .get('/test/create/5')
                .expect(404)
                .end(done);
        });

        it("Should parse and set request body sent via application/json", function(done) {
            var setterSpy = sinon.spy(app.client.Factory.prototype, "setReqBody");
            app.client.routes.post("/test/create/6", function(req, res) {

                assert.deepEqual({_csrfToken: token, myField: true, name: "joe"}, req.body, "Reqest body should be parsed and be identical");
                assert.isTrue(setterSpy.calledOnce, "setReqBody method should be called once");

                setterSpy.restore();

                res.send("good");
            });
            agent
                .post('/test/create/6')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .send({_csrfToken: token, myField: true, name: "joe"})
                .expect('Content-Type', /json/)
                .expect(200, { code: 200, data: 'good', message: 'OK' })
                .end(done);
        });

        it("Should parse request query for parameters sent via GET", function(done) {
            app.client.routes.get("/test/create/6", function(req, res) {

                assert.deepEqual({id: "one"}, req.query, "Request query should be parsed and be identical");

                res.send(200);
            });

            agent
                .get('/test/create/6?id=one')
                .expect('Content-Type', "text/html")
                .expect(200)
                .end(done);
        });

        it("Should response with 500 code if error was thrown in controller", function(done) {

            app.client.routes.get("/error", function(req, res) {

                throw new Error("Test");
            });

            agent
                .get('/error')
                .expect('Content-Type', "text/html")
                .expect(500)
                .end(done);

        });

        describe("Testing res.send method", function() {

            it("Should send static public css file", function(done) {
                // /css/main.css
                agent
                    .get('/css/main.css')
                    .expect('Content-Type', /text\/css/)
                    .expect(200)
                    .end(done);
            });

            it("Should render partial view separately without rendering layout", function(done) {
                var sendSpy, appRenderSpy;

                app.client.routes.get("/test/seven", function(req, res) {

                    sendSpy = sinon.spy(res, "send");
                    appRenderSpy = sinon.spy(app.client.Factory.prototype, "_render");

                    res.render( 'index', { partial: {
                            id: 'testme'
                        }
                    }, function(err, output) {

                        assert.isNull(err, "Error should not exist");
                        assert.isString(output, "Html partial should be rendered");

                        assert.isFalse(sendSpy.called, "Send method should not be called");
                        assert.isTrue(appRenderSpy.calledOnce, "App render method should be called");

                        sendSpy.restore();
                        appRenderSpy.restore();

                        res.send(output)
                    });
                });

                agent
                    .get('/test/seven')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(done);
            });

            it("Should render partial view and then layout", function(done) {

                var sendSpy, appRenderSpy, cacheAddSpy;

                app.client.routes.get("/test/eight", function(req, res) {

                    sendSpy = sinon.spy(res, "send");
                    appRenderSpy = sinon.spy(app.client.Factory.prototype, "_render");
                    cacheAddSpy = sinon.spy(app.cache, "add");

                    res.render('index', {
                        partial: {
                            id: 'testme'
                        }
                    });
                });

                agent
                    .get('/test/eight')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {

                        assert.isNull(err, "Error should not exist");

                        assert.isTrue(sendSpy.calledOnce, "Send method should be called");
                        assert.isTrue(appRenderSpy.calledTwice, "App render method should be called");
                        assert.isFalse(cacheAddSpy.called, "App cache add method should not be called");

                        sendSpy.restore();
                        appRenderSpy.restore();
                        cacheAddSpy.restore();

                        done(err, res);
                    });

            });

            // TODO: test rendering with adding to cache

            describe("JSON", function() {
                it("Should send error as response with passed one argument", function(done) {
                    app.client.routes.post("/test/one", function(req, res) {
                        res.send(500);
                    });
                    agent
                        .post('/test/one')
                        .set('Accept', 'application/json')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(500, {"code":500,"message":"Internal Server Error"})
                        .end(done);
                });

                it("Should send OK response with passed code", function(done) {
                    app.client.routes.post("/test/two", function(req, res) {
                        res.send(200);
                    });
                    agent
                        .post('/test/two')
                        .set('Accept', 'application/json')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200,"message":"OK"})
                        .end(done);
                });

                it("Should send response object", function(done) {
                    app.client.routes.post("/test/three", function(req, res) {
                        res.send({one: "one", two: true});
                    });
                    agent
                        .post('/test/three')
                        .set('Accept', 'application/json')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200,"data":{"one":"one","two":true},"message":"OK"})
                        .end(done);
                });

                it("Should send JSON response with string body", function(done) {
                    app.client.routes.post("/test/four", function(req, res) {
                        res.send("string");
                    });
                    agent
                        .post('/test/four')
                        .set('Accept', 'application/json')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200,"data": "string","message":"OK"})
                        .end(done);
                });

                it("Should send JSON response with route *.json", function(done) {
                    app.client.routes.get("/test/five.json", function(req, res) {
                        res.send("response");
                    });
                    agent
                        .get('/test/five.json')
                        .set('Accept', 'application/json')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200,"data": "response","message":"OK"})
                        .end(done);
                });

                it("Should send returned data from route handler", function(done) {
                    var sendSpy;
                    app.client.routes.get("/test/six", function(req, res) {
                        sendSpy = sinon.spy(res, "send");
                        return {
                            "one": "two"
                        }
                    });
                    agent
                        .get('/test/six')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200, "data": {"one": "two"}, "message":"OK"})
                        .end(function(err, res) {

                            assert.isTrue(sendSpy.calledOnce, "Send method should be called once");
                            assert.deepEqual(sendSpy.args[0][0], {"one": "two"}, "Returned and sent context should be identical");

                            sendSpy.restore();

                            done(err, res);
                        });
                });

                it("Should send json with set Content-Type in a force way", function(done) {

                    app.client.routes.get("/test/seven", function(req, res) {
                        res.send(200, {one: "two"}, "json");
                    });
                    agent
                        .get('/test/seven')
                        .set('Accept', 'text/html')
                        .send({_csrfToken: token, myField: true})
                        .expect('Content-Type', /json/)
                        .expect(200, {"code":200,"data": {one: "two"},"message":"OK"})
                        .end(done);

                });

                it("Should response with 500 code JSON when error was thrown in controller", function(done) {

                    app.client.routes.get("/error/json", function(req, res) {

                        throw new Error("Test");
                    });

                    agent
                        .get('/error/json')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(500, {"code": 500, "message":"Internal Server Error"})
                        .end(done);

                });


            });

        });

    });
});