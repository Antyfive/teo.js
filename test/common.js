global.sinon = require('sinon');
global.chai = require('chai');
global.expect = global.chai.expect;
global.assert = global.chai.assert;
global.teoBase = '../../core';

require('blanket')({        // test coverage setup
    "pattern":"/core"
});