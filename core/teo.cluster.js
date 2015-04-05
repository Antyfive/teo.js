/*!
 * Teo.js cluster
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/5/15
 */

/* global logger  */

var cluster = require("cluster"),
    os = require("os"),
    cpuCount = os.cpus().length;

exports = module.exports = function Cluster(callback) {
    // Code to run if we're in the master process
    if (cluster.isMaster) {
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
};