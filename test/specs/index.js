/*
describe('spec', function () {
	it('should fail', function () {
		expect(1).to.equal(0);
	});
});*/
/* global define, describe, beforeEach, afterEach, it, assert, sinon  */
var TeoJS = require('../../core');

describe('Testing Teo.js framework', function() {
    var app,
        spy,
        readyCallback = function(){};

    beforeEach(function(done) {
        spy = sinon.spy();
        app = new TeoJS(function(){ spy(); done();});
    });

    afterEach(function() {
        app = null;
        spy = null;
    });

    it('Should be function', function() {
        assert.isTrue(typeof TeoJS === "function", "TeoJS not a function");
    });

    it('Should be initialised', function() {
        // assert.equal(spy.args[0][0], "ready", "Framework should fire ready event");
        assert.equal(spy.calledOnce, true, "Framework should call callback function on initialise");
    });

    it('Should have applications prepared', function() {
        assert.equal(Object.keys(app.core.getApps()).length > 0, true, "Applications should be prepared");
    });
});