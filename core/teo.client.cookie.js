/*!
 * Cookies handler
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 1/8/15
 */

var Cookies = require('cookies');

exports = module.exports = function Cookie(opts) {
    if (!(this instanceof Cookie))
        return new Cookie(opts);

    // TODO: to config
    this.gripKeys = ["signed key"];

    return new Cookies(opts.req, opts.res, this.gripKeys);
};
