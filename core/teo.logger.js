/*!
 * Logger module
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/12/15
 */

var moment = require("moment");
var colors = require("colors");
var util = require("util");

var logger = module.exports = {
    success: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Success: %s", message)).green);
    },
    info: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Info: %s", message)).blue);
    },
    warn: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Warn: %s", message)).yellow);
    },
    error: function() {
        try {
            var errors = _parseErrors.apply(this, [].slice.call(arguments));
            var message = _parseMessage.apply(this, errors);
            console.log(format(util.format("Error: %s", message)).red);
        } catch(e) {
            console.error(e.stack);
        }
    },
    fatal: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Fatal Error: %s", message)).red);
    },
    log: function(message) {
        var message = _parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("%s", message)));
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

function format(message) {
    return util.format("[%s] %s", moment(), message);
}