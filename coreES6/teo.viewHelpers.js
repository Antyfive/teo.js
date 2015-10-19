/*!
 * Teo.js view helper
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/2/15
 */

"use strict";

const
    renderer = require("hogan.js");

module.exports = {
    /**
     * Simple renderer
     * @param {String} template
     * @param {Object} context
     * @param {Object} options
     */
    render(template, context, options) {
            let partial = context.partial || {};
            delete context.partial;

            // copyright
            context.copyright = copyright;
            context.version = version;

            let compiled  = renderer.compile(template.toString(), {delimiters:  options.delimiters}),
                output = compiled.render(context, partial);

       return output;
    }
};