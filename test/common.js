global.sinon = require('sinon');
global.chai = require('chai');
global.expect = global.chai.expect;
global.assert = global.chai.assert;
global.teoBase = '../../core';

require('blanket')({        // test coverage setup
    "pattern":"/core"
});

// global.logger = require("../core/teo.logger");

//sinon.stub(logger, "info", function() {});
//sinon.stub(logger, "warn", function() {});
//sinon.stub(logger, "error", function() {});
//sinon.stub(logger, "fatal", function() {});
//sinon.stub(logger, "success", function() {});
//sinon.stub(logger, "log", function() {});