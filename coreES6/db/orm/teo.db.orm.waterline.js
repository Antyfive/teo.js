/*!
 * Teo DB waterline ORM
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 7/5/15
 */

"use strict";

const
    BaseOrm = require("./teo.db.orm");

module.exports = class WaterlineOrm extends BaseOrm {
    constructor(config) {
        super(config);
    }
};