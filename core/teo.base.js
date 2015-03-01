/*!
 * Base class for Teo.js
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 8/10/14
 */

var util = require('./teo.utils'),
    events = require('events'),
    helper = require('./teo.helper');

/**
 * Base class of Teo.js
 * @param params
 * @param callback
 * @returns {Base}
 * @constructor
 * @extends {events.EventEmitter}
 */
function Base(params, callback) {
    if( !(this instanceof Base))
        return new Base(params, callback);

    // allow changeable params
    if ( params instanceof Function )
        var callback = params,
            params = {};

    if ( params instanceof Object )
        var callback = ( typeof callback === 'function' ) ? callback : function() {};

    if ( params === void 0 )
        var params = {},
            callback = function(){};

    return this.initialize.call(this, params, callback);
}

Base.extend = helper.extend;
util.inherits(Base, events.EventEmitter);
util.extend(Base.prototype, {
    initialize: function() {}
});

exports = module.exports = Base;