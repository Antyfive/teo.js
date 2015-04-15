/*!
 * Waterline url
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 4/13/15
 */

var Orm = require("../teo.db.orm");

var WaterlineOrm = Orm.extend({
    initialize: function(config) {
        // TODO: move adapters to the 3-rd party packages
        this.adapterPath = "../adapters";
        Orm.prototype.initialize.call(this, config);
    }
});

module.exports = WaterlineOrm;