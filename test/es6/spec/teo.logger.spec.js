/*!
 * Teo.js logger spec
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/12/15
 */
/* global define, describe, beforeEach, afterEach, it, assert, sinon, teoBase  */

"use strict";

const
    util = require("util"),
    logger = require(`${teoBase}/teo.logger`);

describe("Testing Teo Logger", () => {

    let formatSpy,
        consoleLogStub,
        message = "my message";

    beforeEach(() => {

        formatSpy = sinon.spy(util, "format");
        consoleLogStub = sinon.stub(console, "log", (message) => {
            return message;
        });

    });

    afterEach(() => {

        formatSpy.restore();
        consoleLogStub.restore();

    });

    it("Should log success message", () => {

        logger.success(message);

        assert.deepEqual(formatSpy.args[0], ["Success: %s", message], "Message should be formatted correctly");

    });

    it("Should log info message", function() {

        logger.info(message);

        assert.deepEqual(formatSpy.args[0], ["Info: %s", message], "Message should be formatted correctly");

    });

    it("Should log warn message", () =>  {

        logger.warn(message);

        assert.deepEqual(formatSpy.args[0], ["Warn: %s", message], "Message should be formatted correctly");

    });

    it("Should log error message", () =>  {

        logger.error(message);

        assert.deepEqual(formatSpy.args[0], ["Error: %s", message], "Message should be formatted correctly");

    });

    it("Should parse error object and log error stack", () =>  {

        var error = new Error("My error");

        logger.error(error);

        assert.deepEqual(formatSpy.args[0], ["Error: %s", error.stack], "Error message should be formatted correctly");

    });

    it("Should log fatal error message", () =>  {

        logger.fatal(message);

        assert.deepEqual(formatSpy.args[0], ["Fatal Error: %s", message], "Message should be formatted correctly");

    });

    it("Should format final message correctly", () =>  {

        logger.success(message);

        assert.equal(formatSpy.args[1][0], "[%s] %s", "Format of final message should be correct");
        assert.equal(formatSpy.args[1][2], `\u001b[32mSuccess: ${message}\u001b[39m`, "Message should be formatted correctly");

    });

    it("Should log multiple messages in arguments", () =>  {

        logger.success("One", "two");

        assert.equal(formatSpy.args[1][2], "\u001b[32mSuccess: One|two\u001b[39m", "Message should be formatted correctly");

    });

    it("Should just log message", () =>  {

        logger.log("One", "two");
        assert.equal(formatSpy.args[1][2], "One|two", "Message should be formatted correctly");

    });

});