/*!
 * Teo.JS renderer
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/7/15
 */

"use strict";

const
    consolidate = require("consolidate"),
    _ = require("lodash");

module.exports = {
    /**
     * Renderer function
     * @param {String} tplAbsPath :: absolute path to the template
     * @param {String} templateEngineName :: desired engine
     * @param {Object} data :: data to render
     * @param {Object} [options] :: Additional options (partials etc.)
     * @returns {*}
     */
    * render(tplAbsPath, templateEngineName, data, options) {
        let compiled = yield consolidate[templateEngineName](tplAbsPath, _.extend({}, data || {}, options || {}));
        return compiled;
    }
};