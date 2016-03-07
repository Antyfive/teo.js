/*!
 * handlerMounter spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/7/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const HandlerMounter = require(`${teoLibDir}/handlerMounter`);

describe("testing handlerMounter", () => {

    let handlerPath = "/my/path/to/handler",
        requireStub, handlerMounter, requiredStub, handlerContext, originalRequire, loadedFunctionStub;

    beforeEach(() => {

        requiredStub = sinon.stub();
        originalRequire = module.parent.__proto__.require;
        module.parent.__proto__.require = requiredStub;

        loadedFunctionStub = sinon.stub();

        requiredStub.returns(loadedFunctionStub);

        handlerMounter = HandlerMounter(handlerPath);
        handlerContext = [{myContext: true}, "router", "addModel"];

    });

    afterEach(() => {

        handlerMounter = null;
        requiredStub = null;
        handlerContext = null;
        module.parent.__proto__.require = originalRequire;
        loadedFunctionStub = null;

    });

    it("Should return wrapped handler mounter", () => {

        assert.isFunction(handlerMounter);

    });

    it("Should load and call handler with passed context", () => {

        handlerMounter.apply(this, handlerContext);

        assert.isTrue(requiredStub.calledOnce);
        assert.equal(requiredStub.args[0][0], "/my/path/to/handler");

    });

    it("Should run handler with passed .mixinModuleMounterContextArguments in context", () => {

        let stub = sinon.stub();

        stub.returns(["myRouter", "AddModel"]);

        handlerContext[0].mixinModuleMounterContextArguments = stub;

        handlerMounter.apply(this, handlerContext);

        assert.isTrue(loadedFunctionStub.calledOnce);
        assert.deepEqual(loadedFunctionStub.args[0], ["myRouter", "AddModel"], "Should be called with arguments from .mixinModuleMounterContextArguments method");

    });

    it("Should run handler and omit first argument(context) if no .mixinModuleMounterContextArguments method", () => {

        handlerMounter.apply(this, handlerContext);
        assert.isTrue(loadedFunctionStub.calledOnce);

        assert.deepEqual(loadedFunctionStub.args[0], ["router", "addModel"], "Should be called with all arguments except first");

    });

    it("Should return loaded module if it's an object", () => {

        requiredStub.returns({myObject: true});

        let result = handlerMounter.apply(this, handlerContext);

        assert.deepEqual(result, {myObject: true}, "Should return loaded object");

    });

});