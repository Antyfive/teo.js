/*!
 * Base class
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/10/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */
var Base = require(teoBase + '/teo.base');
describe('Testing App Base Class', function() {
    var base,
        spy,
        instance;

    beforeEach(function() {
        base = Base.extend({
            initialize: function() {}
        });
        spy = sinon.spy(base.prototype, 'initialize');
        instance = new base;
    });

    afterEach(function() {
        base = null;
        spy = null;
        instance = null;
    });

    it('Should call constructor when created', function() {
        assert.equal(spy.calledOnce, true, "Constructor should be called");
    });

    it('Should have extend method', function() {
        assert.equal(typeof base.extend, "function", "Extend function should be available");
    });
});