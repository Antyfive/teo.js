/*!
 * App extensions spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/7/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var AppModules = require(teoBase + '/teo.app.extensions');

describe("Testing Teo.js App Extensions", function () {

    var modules;

    beforeEach(function () {

        var extension = function() {
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

        var extensionConfig = [
            {
                "name": "my-extension-1",
                "module": "my-module-name-1"
            },
            {
                "name": "my-extension-2",
                "file": "my-module-name-2"
            }
        ];

        modules = new AppModules();

    });

    afterEach(function () {

        modules = null;

    });

    it("Should parse passed config on init", function() {

    });

});