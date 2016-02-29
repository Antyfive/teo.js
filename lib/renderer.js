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
        let promise = consolidate[templateEngineName](tplAbsPath, _.extend({}, data || {}, options || {}));
        let result = yield function(callback) {
            promise.then((html) => {
                callback(null, html);
            }, (err) => {
                logger.error(err);
                callback(err);
            });
        };
        return result;
    }
};