/**
 * Index controller
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date {22.03.14}
 */

exports = module.exports = function( client, db ) {         // TDDO receive db client as third argument
    console.log( 'Index controller was initialized' );
    // client.addNamespace( '/index', [ '/', '/:id']);      // example of adding namespace to the route
    /**
     * client.get('/', function( req, res ) {})
     * client.post('/:id', function( req, res ) {})
     * client.put('/:id', function( req, res ) {})
     * client.patch('/:id', function( req, res ) {})
     * client.delete('/:id', function( req, res ) {})
     */
    client.get('/', function( req, res ) {      // both variants available (can return context and make res.end as well)
        /*res.writeHead( 200, { 'Content-Type': 'text/plain' });
         res.end( 'Hello World\n' );*/
        res.render( 'index', { partial: {
            id: 'test'
        }, title: 'Title'
        });                                     // if callback function as third param - no layout renderer
        // return {};
    });

    //client.get('/json/:id', function( req, res, next ) {     // send json
    //    res.json({ id: req.params.id, 'title': "title" });  // send json in your own format
    //});

    //client.get('/:id', function( req, res, next ) {     // next function - e.g. is used for handling async requests
    //    next({ id: req.params.id, 'title': req.params.id });        // without rendering of the partial, data goes direct to layout
    //});

    //client.get("/get/news.json", function(req, res) {
    //    res.send({ id: 1, 'title': "title" }); // send json in common format
    //});

    client.get("/get/error/404", function(req, res) {
        res.send(404);
    });

    //client.get("/get/error/news.json", function(req, res) {
    //    res.send(500);
    //});
};
/**
 *
 * function(app) {
 *  app.get(/.../)
 * }
 **/