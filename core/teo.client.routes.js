/*!
 * Client routes
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/23/14
 */

var Base = require("./teo.base"),
    pathToRegexp = require("path-to-regexp-wrap")({end: true}),
    util = require("./teo.utils");

exports = module.exports = Base.extend({
    initialize: function() {
        this.namespaces = {};
        this.routes = {
            'get': {},
            'post': {},
            'put': {},
            'patch': {},
            'delete': {}
        };
    },
    /**
     * Add new route
     * @param {String} type
     * @param {String} route
     * @param {String|*} namespace
     * @param {Function} callback
     */
    addRoute: function( type, route, namespace, callback ) { // /get/:id
        var routes = this.routes[ type.toLowerCase() ];

        if ( routes === undefined || routes.hasOwnProperty( route ))
            return false;

        routes[ route ] = {
            'match': pathToRegexp( route ),
            'namespace': namespace,
            'callback': callback
        };
        return routes[ route ];
    },
    /**
     * Matcher of the route
     * @param {String} type
     * @param {String} path
     * @returns {*}
     */
    matchRoute: function( type, path ) {
        var type = this.getRoutes()[ type.toLowerCase() ];

        if ( type === undefined )
            return false;

        for ( var r in type ) {
            var match = type[ r ].match( path );
            if ( match )
                return { params: match, handler: type[ r ], route: r, path: path };
        }
    },
    /**
     * Wrapper of add route
     * @param {String} type
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    newRoute: function( type, route, callback ) {
        var namespace = this.getNamespace( route ),
            route = ( typeof namespace === 'string' ) ? namespace + route : route;
        if (( this.routes[ type.toLowerCase() ].hasOwnProperty( route )))     // ? use multiple handlers for one route ?
            return false;

        return this.addRoute( type, route, namespace, callback );
    },
    /**
     * Get type handler
     * @param route :: regexp route
     * @param callback :: callback
     */
    'get': function( route, callback ) {
        return this.newRoute( 'get', route, callback );
    },

    /**
     * POST
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    post: function( route, callback ) {
        return this.newRoute( 'post', route, callback );
    },

    /**
     * PUT
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    put : function( route, callback ) {
        return this.newRoute( 'put', route, callback );
    },

    /**
     * PATCH
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    patch: function( route, callback ) {
        return this.newRoute( 'patch', route, callback );
    },

    /**
     * DELETE
     * @param {String} route
     * @param {Function} callback
     * @returns {*}
     */
    'delete': function( route, callback ) {
        return this.newRoute( 'delete', route, callback );
    },

    /**
     * Add namespace for route
     * @param {String} ns
     * @param {Array} routes
     */
    addNamespace: function( ns, routes ){
        ( Array.isArray( this.namespaces[ ns ]) || ( this.namespaces[ ns ] = []));
        this.namespaces[ ns ].push.apply( this.namespaces[ ns ], routes )
    },

    /**
     * Getter of namespace by route
     * @param {String} route
     * @return {String} :: key value of the
     */
    getNamespace: function( route ) {
        for ( var ns in this.namespaces )
            if ( !!~this.namespaces[ ns ].indexOf( route ))
                return ns;
    },

    // getters ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    /**
     * Routes getter
     * @returns {{get: {}, post: {}, put: {}, patch: {}, delete: {}}}
     */
    getRoutes: function() {
        return this.routes;
    },

    /**
     * Matcher of the route
     * @param {String} type
     * @param {String} path
     * @returns {*}
     */
    matchRoute: function( type, path ) {
        var type = this.getRoutes()[ type.toLowerCase() ];

        if ( type === undefined )
            return false;

        for ( var r in type ) {
            var match = type[ r ].match( path );
            if ( match )
                return { params: match, handler: type[ r ], route: r, path: path };
        }
    }
});