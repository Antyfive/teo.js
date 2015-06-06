/*!
 * Teo.js client
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 6/6/15
 */

const Base = require("./teo.base"),
    _ = require("./teo.utils");

module.exports = {
    Client: Client,
    ClientFactory: ClientFactory
};

class Client extends Base {
    constructor(config, callback) {
        super(config, callback);
    }

}