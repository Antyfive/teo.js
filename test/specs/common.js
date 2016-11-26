"use strict";

global.sinon = require("sinon");
global.chai = require("chai");
global.expect = global.chai.expect;
global.assert = global.chai.assert;
global.co = require("co");
global.teoBase = "../../../core";
global.teoLibDir = "../../../lib";
global.async = generator => done => co(generator).then(done, done);
// logger stub
global.logger = {
    success() {},
    info() {},
    warn() {},
    error() {},
    fatal() {},
    log() {}
};