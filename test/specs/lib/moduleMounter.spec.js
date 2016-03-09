/*!
 * moduleMounter spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/8/16
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const ModuleMounter = require(`${teoLibDir}/moduleMounter`);

describe("Testing moduleMounter", () => {

    let moduleName, indexFileAbsPath, routerFilePath, modelFiles, originalRequire = module.parent.__proto__.require,
        requireStub;

    beforeEach(() => {

        requireStub = sinon.stub();
        module.parent.__proto__.require = requireStub;
        moduleName = "myModule";
        indexFileAbsPath = "/my/index";
        routerFilePath = "/my/router";
        modelFiles = ["/my/path/to/model"]

    });

    afterEach(() => {

        moduleName = indexFileAbsPath = routerFilePath = modelFiles = requireStub = null;
        module.parent.__proto__.require = originalRequire;

    });

    it("Should should return wrapped module mounter function", () => {

        let moduleMounter = ModuleMounter(moduleName, indexFileAbsPath, routerFilePath, modelFiles);

        assert.isFunction(moduleMounter, "Should return a function");
        assert.equal(moduleMounter.name, "moduleMounter", "Function name should be correct");

    });

    describe("Mount module", () => {

        let moduleMounter, handlerMounterStub, contextMock, indexModuleStub;

        beforeEach(() => {

            moduleMounter = ModuleMounter(moduleName, indexFileAbsPath, routerFilePath, modelFiles);
            requireStub.reset();

            handlerMounterStub = sinon.stub();
            requireStub.returns(handlerMounterStub);
            indexModuleStub = sinon.stub();
            handlerMounterStub.returns(indexModuleStub);
            contextMock = {myContext: true};

        });

        afterEach(() => {

            moduleMounter = null;
            handlerMounterStub = contextMock = indexModuleStub = null;
            requireStub.reset();

        });

        it("Should load module index file, router, and model", () => {

            assert.isFalse(requireStub.called);

            moduleMounter(contextMock);

            assert.isTrue(requireStub.calledThrice, "Should call require 3 times to load module index file, router, and one model");
            assert.isTrue(handlerMounterStub.calledThrice, "Should call require 3 times");

            assert.equal(handlerMounterStub.args[0][0], "/my/index", "Should load module index file as first");
            assert.equal(handlerMounterStub.args[1][0], "/my/router", "Should load router file as second");
            assert.equal(handlerMounterStub.args[2][0], "/my/path/to/model", "Should load model as third");

        });

        describe("Run wrapped models and router", () => {

            let routerStub, modelRegisterStub, mountedModule;

            beforeEach(() => {

                modelRegisterStub = sinon.stub();
                routerStub = sinon.stub();
                mountedModule = moduleMounter(contextMock);

            });

            afterEach(() => {

                modelRegisterStub = null;
                routerStub = null;
                mountedModule = null;

            });

            it("Should run mounted module", () => {

                indexModuleStub.reset();

                mountedModule(contextMock, routerStub, modelRegisterStub);

                assert.isTrue(indexModuleStub.calledTwice, "Should run wrapped model and router");

            });

        });


    });

});