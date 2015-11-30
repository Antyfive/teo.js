/*!
 * Index module example
 * @author Andrew Teologov <teologov.and@gmail.com>
 */

"use strict";

module.exports = function(client, db) {
    console.log("Index module has been mounted.");
    // "this" has app's context
    // do some middleware, and extra logic here
    this.middleware(function* (next) {

        logger.log("some middleware");

        yield next;

    });

};