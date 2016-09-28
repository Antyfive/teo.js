/*!
 * Cluster implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/15/15
 */

/* global logger */

"use strict";

const
    cluster = require("cluster"),
    os = require("os");

module.exports = class Cluster {
    constructor(callback) {
        // Code to run if we're in the master process
        if (cluster.isMaster) {
            let cpuCount = os.cpus().length;
            // Create a worker for each CPU
            for (let i = 0; i < cpuCount; i++) {
                cluster.fork();
            }
            // Listen exit event
            cluster.on("exit", (worker) => {
                // replace the dead worker
                logger.log(`Worker ${worker.id} died`);
                cluster.fork();
            });
            // Code to run if we're in a worker process
        } else {
            callback();
        }
    }
};