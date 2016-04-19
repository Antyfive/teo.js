/*!
 * Client context mixins
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/7/15
 */

"use strict";

const path = require("path"),
    renderer = require("../lib/renderer");

module.exports = {
    /**
     * Render mixin
     * @param {String} tpl :: template name without extension
     * @param {Object} moduleData :: data object to compile module
     * @param {Object} [layoutData] :: additional data to compile with layout. E.g. header / footer partials etc.
     */
    * render(tpl, moduleData, layoutData) {
        let tplExtension = this.config.get("templateSettings").extension;
        let tplAbsPath = path.join(this.config.get("appDir"), this.moduleTemplatesDir, `${tpl}.${tplExtension}`);
        let layoutAbsPath = path.join(this.config.get("appDir"), `/templates/layout.${tplExtension}`);

        let modulePartialHTML, layoutHTML;

        try {
            modulePartialHTML = yield* renderer.render(tplAbsPath, this.config.get("templateSettings").engine, moduleData);
            layoutHTML = yield* renderer.render(
                layoutAbsPath,
                this.config.get("templateSettings").engine,
                Object.assign({}, layoutData || {}, {[this.activeModuleName]: modulePartialHTML})
            );
        } catch(err) {
            logger.error(err);
            this.res.send(500);
            return;
        }
        this.res.send(layoutHTML);
    }
};