/*!
 * Client Routes Spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/12/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const Routes = require(`${teoBase}/teo.client.routes`);

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

    it("Should add namespace for the route", () => {

        routes.addNamespace("/index", [ "/", "/:id"]);
        assert.isArray(routes.namespaces["/index"], "Namespace routes holder should be an array");

    });

    it("Should get namespace by route", () => {

        routes.addNamespace("/index", [ "/", "/:id"]);

        let route1 = routes.getNamespace("/");
        let route2 = routes.getNamespace("/:id");

        assert.equal(route1, "/index", "Namespace should be found");
        assert.equal(route2, "/index", "Namespace should be found");

    });

});