/*!
 * Logger module
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/12/15
 */

var moment = require("moment");
var colors = require("colors");
var util = require("util");
var cluster = require("cluster");

var logger = module.exports = {
    success: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Success: %s", message).green);
    },
    info: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Info: %s", message).blue);
    },
    warn: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Warn: %s", message).yellow);
    },
    error: function() {
        try {
            var errors = _parseErrors.apply(this, [].slice.call(arguments));
            var message = _parseMessage.apply(this, errors);
            _log(util.format("Error: %s", message).red);
        } catch(e) {
            console.error(e.stack);
        }
    },
    fatal: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Fatal Error: %s", message).red);
    },
    log: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("%s", message));
    }
};

/**
 * Parses errors. Expects Error instance, or string with message
 * @returns {Array}
 * @private
 */
function _parseErrors() {
    var errors = [].slice.call(arguments);
    var parsed = [];

    errors.forEach(function(err) {
        var message = (err instanceof Error) ? err.stack : err.toString();
        parsed.push(message);
    });

    return parsed;
}

/**
 * Parses message
 * @param {*} message
 * @returns {string}
 * @private
 */
function _parseMessage(message) {
    var message = [].slice.call(arguments).join("|");
    try {
        var message = (typeof message === "string") ? message : JSON.stringify(message);
    } catch(e) {
        logger.error(e.stack);
    }

    return message;
}

function _format(message) {
    return util.format("[%s] %s", moment(), message);
}

/**
 * Logs message. Forwards message from child process to master
 * @param {String} message
 * @private
 */
function _log(message) {
    if (cluster.isMaster) {
        // write directly to the log file
        console.log(_format(message));
    }
    else {
        // send to master
        cluster.worker.process.send({
            type: "logging",
            data: {
                message: message,
                workerID: cluster.worker.id,
                pid: cluster.worker.process.pid
            }
        });
    }
}