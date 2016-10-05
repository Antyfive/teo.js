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

describe("Testing Teo.JS Cluster", () => {

    beforeEach(() => {

        sinon.stub(os, "cpus", () => new Array(2));
        sinon.stub(cluster, "fork", () => {});

    });

    afterEach(() => {

        os.cpus.restore();
        cluster.fork.restore();
        cluster.removeAllListeners('exit');

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

    it("Should fork two workers", (done) => {

        new Cluster(function() {});

        process.nextTick(() => {

            assert.isTrue(cluster.fork.calledTwice, "Fork two workers");

            done();

        });

    });

    it("Should fork new cluster on `exit` event", (done) => {

        new Cluster(function() {});

        cluster.fork.reset();

        cluster.emit('exit', {id: 'test'});

        process.nextTick(() => {

            assert.isTrue(cluster.fork.calledOnce, "Fork two workers");

            done();

        });

    });

});