/*!
 * Handler mounter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/23/15
 */

// router middleware which does require() on first activation
// instead of:
//   require('./router').middleware()
// do:
//   require('lib/lazyRouter')('./router')
// purpose: don't require everything on startup

module.exports = function(handlerAbsPath) {
    var handler = null;

    return function handlerMounter(handlerContext) {    // app's context or client
        if (!handler) {
            handler = module.parent.require.call(this, handlerAbsPath); // do not pass context as argument
        }

        if (handler instanceof Function) {
            return handler.apply(handlerContext, [].slice.call(arguments, 1));
        }
        else if (handler instanceof Object) {
            return handler;
        }
    };

};

delete require.cache[__filename];
