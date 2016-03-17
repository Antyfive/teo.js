/*!
 * Teo.JS renderer
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/7/15
 */

"use strict";

const consolidate = require("consolidate");

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
        let promise = this.getRendererEngine(templateEngineName)(tplAbsPath, Object.assign({}, data || {}, options || {}));
        let result = yield function(callback) {
            promise.then((html) => {
                callback(null, html);
            }, (err) => {
                callback(err);
            });
        };
        return result;
    },

    /**
     * Returns renderer engine by it's name
     * @param templateEngineName
     * @returns {*}
     */
    getRendererEngine(templateEngineName) {
        return consolidate[templateEngineName];
    }
};