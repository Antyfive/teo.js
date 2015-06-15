/*!
 * Cluster implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/15/15
 */

/* global logger */

const
    cluster = require("cluster"),
    os = require("os");

exports = module.exports = class Cluster {
    constructor(callback) {
        // Code to run if we're in the master process
        if (cluster.isMaster) {
            var cpuCount = os.cpus().length;
            // Create a worker for each CPU
            for (var i = 0; i < cpuCount; i++) {
                cluster.fork();
            }
            // Listen exit event
            cluster.on("exit", function (worker) {
                // replace the dead worker
                logger.log("Worker " + worker.id + " died");
                cluster.fork();
            });
            // Code to run if we're in a worker process
        } else {
            callback();
        }
    }
};