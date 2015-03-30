/*!
 * Dev app
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 3/22/15
 */

var Teo = require("teo.js"),
    app = new Teo({dirname: __dirname});

app.on("ready", function() {
    app.start(function(err, apps) {
        console.log("Teo.js server has started");
    });
});
