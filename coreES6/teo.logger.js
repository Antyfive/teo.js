/*!
 * Logger module
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 24/5/15
 */

"use strict";

const moment = require("moment"),
    colors = require("colors"),
    util = require("util"),
    cluster = require("cluster");



/**
 * Parses errors. Expects Error instance, or string with message
 * @returns {Array}
 * @private
 */
function _parseErrors() {
    let errors = [].slice.call(arguments);
    let parsed = [];

    errors.forEach(err => {
        let message = (err instanceof Error) ? err.stack : err.toString();
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
function _parseMessage() {
    let message = [].slice.call(arguments).join("|");
    try {
        message = (typeof message === "string") ? message : JSON.stringify(message);
    } catch(e) {
        logger.error(e.stack);
    }

    return message;
}

function _format(message) {
    return util.format("[%s] %s", moment().toString().cyan, message);
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

module.exports = {
    success() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Success: %s", message).green);
    },
    info() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Info: %s", message).blue);
    },
    warn() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Warn: %s", message).yellow);
    },
    error() {
        try {
            let errors = _parseErrors.apply(this, [].slice.call(arguments));
            let message = _parseMessage.apply(this, errors);
            _log(util.format("%s", message).red);
        } catch(e) {
            console.error(e.stack);
        }
    },
    fatal() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("Fatal: %s", message).red);
    },
    log() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("%s", message));
    },
    showLogo() {
        console.log(
            '\n'+
            '████████╗███████╗ ██████╗         ██╗███████╗\n' +
            '╚══██╔══╝██╔════╝██╔═══██╗        ██║██╔════╝\n' +
            '   ██║   █████╗  ██║   ██║        ██║███████╗\n' +
            '   ██║   ██╔══╝  ██║   ██║   ██   ██║╚════██║\n' +
            '   ██║   ███████╗╚██████╔╝██╗╚█████╔╝███████║\n' +
            '   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝ ╚════╝ ╚══════╝\n' +
            '\n'
        );
    }
};

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----