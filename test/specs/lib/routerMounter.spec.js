/*!
 * routerMounter spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/3/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const routerMounter = require(`${teoLibDir}/routerMounter`);

describe("Testing routerMounter", () => {

    let routerObject, nsStub, moduleName, optionalNamespace, contextStub;

    beforeEach(() => {

        let methodsObject = {
            get     : () => {},
            post    : sinon.stub(),
            put     : sinon.stub(),
            patch   : sinon.stub(),
            delete  : sinon.stub()
        };

        let getStub = sinon.stub();
        getStub.returns("");

        contextStub = {
            config: {"get": getStub}
        };

        nsStub = sinon.stub();
        routerObject = {
            ns: nsStub
        };

        sinon.stub(methodsObject, "get", (route, handler) => {
            co(function* () {
                yield* handler.call(contextStub, "req", "res");
            })
        });
        nsStub.returns(methodsObject);

        moduleName = "test";
        optionalNamespace = "testNamespace";

    });

    afterEach(() => {

        routerObject = null;
        nsStub = null;
        moduleName = null;
        optionalNamespace = null;
        contextStub = null;

    });

    it("Should mount router and returned wrapped http methods", () => {

        let mounted = routerMounter(routerObject, moduleName);

        assert.isObject(mounted);
        assert.deepEqual(Object.keys(mounted), ["get", "post", "put", "patch", "delete"]);

    });

    it("Should wrap single method", (done) => {

        let mounted = routerMounter(routerObject, moduleName);
        let routeHandler = function* () {

            assert.equal(this.moduleTemplatesDir, "test/templates", "moduleTemplatesDir should be correct in called context");
            assert.equal(this.activeModuleName, "test", "activeModuleName should be correct");

            process.nextTick(() => {
                assert.isFalse(this.hasOwnProperty("moduleTemplatesDir"), "moduleTemplatesDir should be deleted from the context after handler is done");
                assert.isFalse(this.hasOwnProperty("activeModuleName"), "activeModuleName should be deleted from the context after handler is done");

                done();
            });

        };
        mounted.get("/myroute", routeHandler);

    });

    it("Should catch and log handler's error", (done) => {

        let loggerStub = sinon.stub(logger, "error");
        let mounted = routerMounter(routerObject, moduleName);
        let routeHandler = function* () {

            process.nextTick(() => {
                assert.isFalse(this.hasOwnProperty("moduleTemplatesDir"), "moduleTemplatesDir should be deleted from the context after handler is done");
                assert.isFalse(this.hasOwnProperty("activeModuleName"), "activeModuleName should be deleted from the context after handler is done");

                assert.isTrue(loggerStub.calledOnce);
                loggerStub.restore();

                done();
            });

            throw new Error("test");
        };

        mounted.get("/myroute", routeHandler);

    });

});