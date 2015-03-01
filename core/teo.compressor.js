/*!
 * Compressor for the output
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 09.06.14
 */

exports = module.exports = Compressor;

/**
 * Compressor of the output html
 * @returns {Compressor}
 * @constructor
 */
function Compressor() {
    var self = this;
    var regexps = [ /[\n\r\t]+/g, /\s{2,}/g ];

    /**
     * Remover of the html comment blocks
     * @param html
     * @returns {*}
     * @private
     */
    function _clearHTMLComments( html ) {
        var cStart = '<!--',
            cEnd = '-->',
            beg = html.indexOf( cStart),
            end = 0;

        while ( beg !== -1 ) {
            end = html.indexOf( cEnd, beg + 4 );

            if ( end === -1 )
                break;

            var comment = html.substring( beg, end + 3 );

            if ( comment.indexOf( '[if' ) !== -1 || comment.indexOf( '![endif]' ) !== -1 ) { // skip
                beg = html.indexOf( cStart, end + 3 );
                continue;
            }

            html = html.replace( comment, '' );
            beg = html.indexOf( cStart, end + 3 );
        }

        return html;
    }

    // ---- ---- ---- ---- ----

    /**
     * Compressor of the html string
     * @param {String} html
     * @returns {*}
     */
    self.compressHTML = function( html ) {
        if ( html === null || html === '' )
            return html;

        html = _clearHTMLComments( html );

        var tags = [ 'script', 'textarea', 'pre', 'code' ],
            id = new Date().getTime() + '#',
            cache = {},
            index = 0;

        tags.forEach( function( tag, i ) {
            var tagS = '<' + tag,
                tagE = '</' + tag + '>',
                start = html.indexOf( tagS ),
                end = 0,
                len = tagE.length;

            while ( start !== -1 ) {
                end = html.indexOf( tagE, start );
                if ( end === -1 )
                    break;

                var key = id + ( index++ ),
                    value = html.substring( start, end + len );

                if ( i === 0 ) {
                    end = value.indexOf( '>' );
                    len = value.indexOf( 'type="text/template"' );
                    if ( len < end && len !== -1 )
                        break;
                    len = value.indexOf( 'type="text/html"' );
                    if ( len < end && len !== -1 )
                        break;
                }
                cache[ key ] = value;
                html = html.replace( value, key );
                start = html.indexOf( tagS, start + tagS.length );
            }
        });
        regexps.forEach( function( regexp ) {
            html = html.replace( regexp, '' );
        });
        Object.keys( cache ).forEach( function( key ) {
            html = html.replace( key, cache[ key ]);
        });

        return html;
    };

    // api ----
    return self;
}