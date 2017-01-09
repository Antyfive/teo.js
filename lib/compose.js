/**
 * Upgraded version of https://github.com/koajs/compose
 * Allows to pass a custom arguments to the middleware functions
 */

module.exports = compose;

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose(middleware) {
	const args = [].slice.call(arguments, 1);
  return function *(next) {
    if (!next) next = noop();

    var i = middleware.length;

    while (i--) {
      next = middleware[i].apply(this, args.concat(next));
    }

    return yield *next;
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}