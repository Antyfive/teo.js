"use strict";

global.sinon = require("sinon");
global.chai = require("chai");
global.expect = global.chai.expect;
global.assert = global.chai.assert;
global.supertest = require("supertest");
global.co = require("co");
global.teoBase = "../../../coreES6";
global.async = generator => done => co(generator).then(done, done);

// TODO: test coverage