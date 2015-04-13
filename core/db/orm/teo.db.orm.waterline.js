/*!
 * Waterline url
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/13/15
 */

var Orm = require("../teo.db.orm");

exports = module.exports = Orm.extend({
    initialize: function(config) {
        this.adapterPath = "../adapters";
        Orm.prototype.initialize.call(this, config);
    }
});