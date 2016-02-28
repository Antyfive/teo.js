/*!
 * Handler mounter
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/23/15
 */

// handler wrapper,  which does require() on first activation
// purpose: don't require everything on startup

module.exports = function(handlerAbsPath) {
    var handler = null;

    // expects app's context as first argument, router instance, model register
    return function handlerMounter(handlerContext) {
        if (!handler) {
            handler = module.parent.require.call(this, handlerAbsPath); // do not pass context as argument
        }
        // run wrapped module
        if (handler instanceof Function) {
            if (handlerContext.getRouterMountingArguments instanceof Function) { // getRouterMountingArguments should return Array of arguments
                return handler.apply(handlerContext, handlerContext.getRouterMountingArguments());
            }
            else {  // otherwise it will be called with [Router, addModel] as for now.
                return handler.apply(handlerContext, [].slice.call(arguments, 1));
            }
        }
        // return object
        else if (handler instanceof Object) {
            return handler;
        }
    };

};

delete require.cache[__filename];