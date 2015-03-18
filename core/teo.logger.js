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
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Success: %s", message)).green);
    },
    info: function(message) {
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Info: %s", message)).blue);
    },
    warn: function(message) {
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Warn: %s", message)).yellow);
    },
    error: function(message) {
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Error: %s", message)).red);
    },
    fatal: function(message) {
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("Fatal Error: %s", message)).red);
    },
    log: function(message) {
        var message = parseMessage.apply(this, [].slice.call(arguments));
        console.log(format(util.format("%s", message)));
    }
};

function parseMessage(message) {
    var message = [].slice.call(arguments).join("|");
    try {
        var message = (typeof message === "string") ? message : JSON.stringify(message);
    } catch(e) {
        logger.error(e.message);
    }

    return message;
}

function format(message) {
    return util.format("[%s] %s", moment(), message);
}