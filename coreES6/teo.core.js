
/* global logger */

let fs = require("fs"),
    async = require("async"),
    util = require("./teo.utils"),
    Base = require("./teo.base"),
    // App = require("./teo.app"),
    Path = require("path"),
    cluster = require("cluster");

export default class Core extends Base {
	constructor(options, callback) {
		super(options, callback);

		this.callback();
	}
}