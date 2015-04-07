/*!
 * Cluster spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/6/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

var Cluster = require(teoBase + "/teo.cluster"),
    cluster = require("cluster"),
    os = require("os");


describe("Testing Cluster", function() {

    beforeEach(function() {

        sinon.stub(os, "cpus", function() {
            return new Array(2);
        });

        sinon.stub(cluster, "fork", function() {});

    });

    afterEach(function() {

        os.cpus.restore();
        cluster.fork.restore();

    });

    it("Should call callback on not master process", function(done) {

        var spy = sinon.spy(function() {});

        cluster.isMaster = false;

        new Cluster(spy);

        process.nextTick(function() {
            assert.isTrue(spy.calledOnce, "Callback should be called");
            cluster.isMaster = true;
            done();
        })

    });

    it("Should fork two workers", function() {

        new Cluster(function() {});

        assert.isTrue(cluster.fork.calledTwice, "Fork two workers");

    });

});