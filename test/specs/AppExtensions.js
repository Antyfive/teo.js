/*!
 * App extensions spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/7/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var AppModules = require(teoBase + '/teo.app.extensions');

describe("Testing Teo.js App Extensions", function () {

    var extensions,
        extension = function() {
            return {
                // is used in app config with this namespace
                configNamespace: "my-module-config",
                // module's config
                config: {
                    "myParam": "1"
                },
                extension: function(app) {
                    app.middleware(function(req, res, next) {
                        req.setHeader("X-Powered-By", "Teo.js");
                        next();
                    });
                }
            }
        };

    beforeEach(function () {

        extensions = new AppModules({
            filePath: "/extensions",
            app: {
                test: "true"
            }
        });

    });

    afterEach(function () {

        extensions = null;

    });

    it("Should parse passed config on init", function() {

        assert.equal(extensions.filePath, "/extensions", "File path should be set");

    });

    it("Should resolve passed extensions on initialization", function() {

        var addStub = sinon.stub(extensions, "add", function() {});

        extensions.initialize({
            extensionsList: [
                {
                    "name": "my-extension-1",
                    "module": "my-module-name-1"
                },
                {
                    "name": "my-extension-2",
                    "file": "my-module-name-2"
                }
            ]
        });


        assert.isTrue(addStub.calledOnce, "Extensions should be added");
        assert.deepEqual(addStub.args[0][0], [
            {
                "name": "my-extension-1",
                "module": "my-module-name-1"
            },
            {
                "name": "my-extension-2",
                "file": "my-module-name-2"
            }
        ], "Arguments should be correct");


        addStub.restore();

    });

    it("Should throw error on adding extension with not correct config", function() {

        assert.throw(function() {
            extensions.add();
        }, "Extension config should be an object");

        assert.throw(function() {
            extensions.add({});
        }, "Extension config should have 'module' or 'file' property");

        assert.throw(function() {
            extensions.add({file: "aaa"});
        }, "Extension config should have 'name' property");

    });

    it("Should throw error on resolving of extension", function() {

        var resolveSpy = sinon.spy(extensions, "_resolveExtension");

        var add = function() {
            extensions.add({
                "name": "my-extension-1",
                "module": "my-module-name-1"
            });
        };

        assert.throw(add, "Cannot find module 'my-module-name-1'");
        assert.isTrue(resolveSpy.calledOnce, "Resolve method should be called");

        resolveSpy.restore();

    });

    it("Should resolve module extension and add it to registry", function() {

        var requireStub = sinon.stub(extensions, "__requireExtension");

        requireStub.withArgs("my-module-name-1").returns({
            // is used in app config with this namespace
            configNamespace: "my-module-config",
            // module's config
            config: {
                "myParam": "1"
            }
        });

        var resolveSpy = sinon.spy(extensions, "_resolveExtension");

        extensions.add({
            "name": "my-extension-1",
            "module": "my-module-name-1"
        });

        assert.isTrue(resolveSpy.calledOnce, "Resolve method should be called");
        assert.isTrue(requireStub.calledOnce, "Extension should be loaded");
        assert.equal(requireStub.args[0][0], "my-module-name-1", "Extension should be loaded");
        assert.deepEqual({
            // is used in app config with this namespace
            configNamespace: "my-module-config",
            // module's config
            config: {
                "myParam": "1"
            }
        }, extensions._loadedExtensions["my-extension-1"], "Extensions registry should be updated");

        resolveSpy.restore();
        requireStub.restore();

    });

    it("Should resolve local file extension", function() {

        var requireStub = sinon.stub(extensions, "__requireExtension");

        requireStub.withArgs("my-file-name-1").returns({
            // is used in app config with this namespace
            configNamespace: "my-file-config",
            // module's config
            config: {
                "myParam": "1"
            }
        });

        var resolveSpy = sinon.spy(extensions, "_resolveExtension");

        extensions.add({
            "name": "my-extension-1",
            "file": "my-file-name-1"
        });

        assert.equal(requireStub.args[0][0], "/extensions/my-file-name-1", "Extension path should be correct");

        resolveSpy.restore();
        requireStub.restore();

    });

    it("Should throw error if extension was not loaded", function() {

        assert.throw(function() {
            extensions.add({
                "name": "my-extension-1",
                "file": "my-file-name-1"
            });
        }, "Cannot find module '/extensions/my-file-name-1'")

    });

    describe("Testing run of extension", function() {

        var requireStub;

        beforeEach(function() {

            requireStub = sinon.stub(extensions, "__requireExtension");

            requireStub.withArgs("my-module-name-1").returns({
                // is used in app config with this namespace
                configNamespace: "my-module-config",
                // module's config
                config: {
                    "myParam": "1"
                },
                "extension": function() {

                }
            });

            extensions.add({
                "name": "my-extension-1",
                "module": "my-module-name-1"
            });

        });

        afterEach(function() {

            requireStub.restore();

        });

        it("Should throw an error if extension is not object", function() {   // check it, when run loaded extension

            var findLoadedByNameStub = sinon.stub(extensions, "_findLoadedByName", function() {
                return undefined;
            });

            assert.throw(function() {
                extensions.runSingle("my-extension-1");
            }, "Extension \'my-extension-1\' should be an object");

            findLoadedByNameStub.restore();

        });

        it("Should throw an error if it doesn't have 'extension' property", function() {

            var findLoadedByNameStub = sinon.stub(extensions, "_findLoadedByName", function() {
                return {};
            });

            assert.throw(function() {
                extensions.runSingle("my-extension-1");
            }, "'my-extension-1' should have 'extension' property, and it should be a function");

            findLoadedByNameStub.restore();

        });

        it("Should run all loaded extensions", function(done) {

            var extensionSpy = sinon.spy(extensions._findLoadedByName("my-extension-1"), "extension");
            var runSingleSpy = sinon.spy(extensions, "runSingle");

            extensions.add({
                "name": "my-extension-1",
                "module": "my-module-name-1"
            });

            extensions.runAll(function() {

                assert.isTrue(extensionSpy.calledOnce, "Extension method should be called once");
                assert.deepEqual(extensionSpy.args[0][0], {test: "true"}, "App should be passed as argument");
                assert.deepEqual(extensions._installedExtensions, ["my-extension-1"], "Installed extensions registry should be updated");

                assert.isTrue(runSingleSpy.calledOnce, "Runner of extension should be called once");

                extensionSpy.restore();
                runSingleSpy.restore();

                done();
            });

        });

    });

});