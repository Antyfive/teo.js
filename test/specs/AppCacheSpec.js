/*!
 * App cache spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 9/24/14
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var AppCache = require(teoBase + '/teo.app.cache');

describe("Testing App Cache", function() {
    var appCache;

    beforeEach(function() {
        appCache = new AppCache;
        appCache.add('test', 'val');
    });

    afterEach(function() {
        appCache = null;
    });

    it("Should add new cache item", function() {
        assert.equal(appCache.cache['test'], 'val', "Value should be added to cache");
    });

    it("Should get item from cache by key", function() {
        assert.equal(appCache.get('test'), 'val', "Value should be returned from cache");
    });

    it("Should return all values by special character", function() {
        appCache.add('test2', 'val2');
        assert.deepEqual(Object.keys(appCache.get('*')), ['test', 'test2'], "All cached values should be returned from cache");
    });
});