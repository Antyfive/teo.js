/*!
 * Teo.js App
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 5/26/15
 */

const Base = require("./teo.base"),
    _ = require("./teo.utils");

class App extends Base {
    constructor(config, callback) {
        super(config, callback);

        var self = this;
        self.emit("app:ready", this);
        callback(this);
        /*process.nextTick(() => {
            debugger;
            self.emit("app:ready", this);
            _.isFunction(callback) ? callback() : null;
        });*/

    }

    myMethod() {

    }
}

module.exports = App;