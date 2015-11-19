/*!
 * Base class for Teo.js
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 17/6/14
 */

"use strict";

const events = require("events"),
    co = require("co");

class Base extends events.EventEmitter {
	// constructor
	constructor(config, callback) {
		// allow not strict order of arguments
	    if (config instanceof Function) {
	        var callback = config,
	            config = {};
	    }

	    if (config instanceof Object) {
	        var callback = (typeof callback === "function") ? callback : function() {};
	    }

	    if (config === void 0) {
	        var config = {},
	            callback = function() {};
	    }

		super();
		
	    this.applyConfig(config);
	    this.callback = callback;
	}

	applyConfig(config) {
		this.config = config;
	}
}

module.exports = Base;