/*!
 * Routes module spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/24/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var Routes = require(teoBase + '/teo.client.routes');

describe('Teo.js Client - Testing Routes', function() {
    var routes,
        assertIsRoute = function(addSpy, route) {
            assert.equal(route instanceof Object, true, "Route should be an object");
            assert.equal(addSpy.calledOnce, true, "Add route method should be called");
        };

    beforeEach(function() {
        routes = new Routes();
    });

    afterEach(function() {
        routes = null;
    });

    it('Should create routes module', function() {
        assert.equal(routes instanceof Routes, true, 'Routes module should be created');
    });

    it('Should add GET type route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.get('/test/:id', function() {});
        assertIsRoute(addRouteSpy, route);
    });

    it('Should add POST type route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.post('/test/:id', function() {});
        assertIsRoute(addRouteSpy, route);
    });

    it('Should add PUT type route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.put('/test/:id', function() {});
        assertIsRoute(addRouteSpy, route);
    });

    it('Should add PATCH type route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.patch('/test/:id', function() {});
        assertIsRoute(addRouteSpy, route);
    });

    it('Should add DELETE type route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.delete('/test/:id', function() {});
        assertIsRoute(addRouteSpy, route);
    });

    it('Should not overwrite already added route', function() {
        var addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.get('/test/:id', function() {}),
            route2 = routes.get('/test/:id', function() {});

        assert.equal(route instanceof Object, true, "Route should be an object");
        assert.equal(route2 === false, true, "The same route should not be added again");
    });

    it('Should match added route', function() {
        var route = routes.get('/test/:id', function(){}),
            match = routes.matchRoute('get', '/test/1');

        assert.equal(match.params.id, "1", "Should have params parsed from route");
        assert.equal(match.route, "/test/:id", "Should have the same route");
    });

    it('Should add namespace for the route', function() {
        routes.addNamespace( '/index', [ '/', '/:id']);
        assert.equal(routes.namespaces['/index'] instanceof Array, true, "Namespace routes holder should be an array");
    });

    it('Should get namespace by route', function() {
        routes.addNamespace( '/index', [ '/', '/:id']);
        var route1 = routes.getNamespace('/');
        var route2 = routes.getNamespace('/:id');

        assert.equal((route1 === "/index"), true, "Namespace should be found");
        assert.equal((route2 === "/index"), true, "Namespace should be found");
    });
});
