/*!
 * Cookies handler
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 1/8/15
 */

var Cookies = require('cookies');

exports = module.exports = function Cookie(opts) {
    if (!(this instanceof Cookie))
        return new Cookie(opts);

    this.keys = opts.config.keys;

    return new Cookies(opts.req, opts.res, this.keys);
};
