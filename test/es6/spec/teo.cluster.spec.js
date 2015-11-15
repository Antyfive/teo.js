/*!
 * Teo cluster spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/15/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    Cluster = require(`${teoBase}/teo.cluster`),
    cluster = require("cluster"),
    os = require("os");

describe("Testing Teo Cluster", () => {

    beforeEach(() => {

        sinon.stub(os, "cpus", function() {
            return new Array(2);
        });

        sinon.stub(cluster, "fork", function() {});

    });

    afterEach(() => {

        os.cpus.restore();
        cluster.fork.restore();

    });

    it("Should call callback on not master process", (done) => {

        let spy = sinon.spy();

        cluster.isMaster = false;

        new Cluster(spy);

        process.nextTick(() => {

            assert.isTrue(spy.calledOnce, "Callback should be called");
            cluster.isMaster = true;
            done();

        })

    });

    it("Should fork two workers", () => {

        new Cluster(function() {});

        assert.isTrue(cluster.fork.calledTwice, "Fork two workers");

    });

});