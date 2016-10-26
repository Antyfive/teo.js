/*!
 * Client Routes Spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/12/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const Routes = require(`${teoBase}/teo.client.router`);

describe("Testing Teo Client Routes", () => {

    let routes,
        assertIsRoute = function(addSpy, route) {

            assert.isObject(route, "Route should be an object");
            assert.isTrue(addSpy.calledOnce, "Add route method should be called once");

        };

    beforeEach(() => {

        routes = new Routes();

    });

    afterEach(() => {

        routes = null;

    });

    it("Should create routes module", () => {

        assert.instanceOf(routes, Routes, "Routes module should be created");

    });

    it("Should add GET type route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.get("/test/:id", () => {});

        assertIsRoute(addRouteSpy, route);

    });

    it("Should add POST type route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.post("/test/:id", () => {});

        assertIsRoute(addRouteSpy, route);

    });

    it("Should add PUT type route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.put("/test/:id", () => {});

        assertIsRoute(addRouteSpy, route);

    });

    it("Should add PATCH type route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.patch("/test/:id", () => {});

        assertIsRoute(addRouteSpy, route);

    });

    it("Should add DELETE type route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.delete("/test/:id", () => {});

        assertIsRoute(addRouteSpy, route);

    });

    it("Should not overwrite already added route", () => {

        let addRouteSpy = sinon.spy(routes, "addRoute"),
            route = routes.get("/test/:id", () => {}),
            route2 = routes.get("/test/:id", () => {});

        assert.isObject(route, "Route should be an object");
        assert.isUndefined(route2, "The same route should not be added again");

    });

    it("Should match added route", () => {

        let route = routes.get("/test/:id", () =>{}),
            match = routes.matchRoute("get", "/test/1");

        assert.equal(match.params.id, "1", "Should have params parsed from route");
        assert.equal(match.route, "/test/:id", "Should have the same route");

    });

    it("Should add GET route with namespace", () => {

        let getTypeSpy = sinon.spy(routes, "get");

        routes.ns("/users")
            .get("/:id", function* () {});


        assert.isTrue(getTypeSpy.calledOnce);
        assert.equal(getTypeSpy.args[0][0], "/users/:id", "Route should be correct");

        let matchedRoute = routes.matchRoute("get", "/users/1");

        assert.equal(matchedRoute.params.id, "1", "Should have params parsed from route");
        assert.equal(matchedRoute.route, "/users/:id", "Should find correct route");

        getTypeSpy.restore();

    });

    it("Should add POST route with namespace", () => {

        let postTypeSpy = sinon.spy(routes, "post");

        routes.ns("/users")
            .post("/:id", function* () {});


        assert.isTrue(postTypeSpy.calledOnce);
        assert.equal(postTypeSpy.args[0][0], "/users/:id", "Route should be correct");

        let matchedRoute = routes.matchRoute("post", "/users/1");

        assert.equal(matchedRoute.params.id, "1", "Should have params parsed from route");
        assert.equal(matchedRoute.route, "/users/:id", "Should find correct route");

        postTypeSpy.restore();

    });

    it("Should add PUT route with namespace", () => {

        let putTypeSpy = sinon.spy(routes, "put");

        routes.ns("/users")
            .put("/:id", function* () {});


        assert.isTrue(putTypeSpy.calledOnce);
        assert.equal(putTypeSpy.args[0][0], "/users/:id", "Route should be correct");

        let matchedRoute = routes.matchRoute("put", "/users/1");

        assert.equal(matchedRoute.params.id, "1", "Should have params parsed from route");
        assert.equal(matchedRoute.route, "/users/:id", "Should find correct route");

        putTypeSpy.restore();

    });

    it("Should add PATCH route with namespace", () => {

        let patchTypeSpy = sinon.spy(routes, "patch");

        routes.ns("/users")
            .patch("/:id", function* () {});


        assert.isTrue(patchTypeSpy.calledOnce);
        assert.equal(patchTypeSpy.args[0][0], "/users/:id", "Route should be correct");

        let matchedRoute = routes.matchRoute("patch", "/users/1");

        assert.equal(matchedRoute.params.id, "1", "Should have params parsed from route");
        assert.equal(matchedRoute.route, "/users/:id", "Should find correct route");

        patchTypeSpy.restore();

    });

    it("Should add DELETE route with namespace", () => {

        let deleteTypeSpy = sinon.spy(routes, "delete");

        routes.ns("/users")
            .delete("/:id", function* () {});


        assert.isTrue(deleteTypeSpy.calledOnce);
        assert.equal(deleteTypeSpy.args[0][0], "/users/:id", "Route should be correct");

        let matchedRoute = routes.matchRoute("delete", "/users/1");

        assert.equal(matchedRoute.params.id, "1", "Should have params parsed from route");
        assert.equal(matchedRoute.route, "/users/:id", "Should find correct route");

        deleteTypeSpy.restore();

    });

    it("Shouldn't add the same route second time", () => {

        let route1 = routes.get("/test/:id", function route() {});
        let route2 = routes.get("/test/:id", () => {});

        assert.isObject(route1);
        assert.isUndefined(route2);

    });

    it("Shouldn't match route if method is not registered", () => {

        let route = routes.matchRoute("customMethod");

        assert.isFalse(route);

    });

});