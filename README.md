# Teo.js
Please, meet yet another Node.js based web-framework.

## Installing the framework

#### NPM
`npm install teo.js -g`

#### Clone git repo
`git clone https://github.com/Antyfive/teo.js.git`

## Setup
#### Config
So, how to create config, which will be applied to your app?
In home directory of your application, just create `config` directory, and place inside your `js` file.
##### Here is default set of currently available properties:
```javascript
    protocol: "http",                       // as for version 0.1.0, only http is available
    host: "localhost",                      // your host
    port: 3000,                             // port
    delimiters: '{{ }}',                    // template engine delimiters
    compressOutput: false,                  // compress output html
    cache: {
        "static": false,                    // cache static files
        "response": false                   // cache response by url
    },
    appDirs: ["models", "controllers"],     // app's directories to read and collect files inside, on system start
    appFiles: ["app.js"]                    // app's additional files to read and cache on system start
```
Also, config is allowed to be splitted into development & production modes. Here is example of config for the test application:
```javascript
module.exports = {
    "production": {         // production mode
        protocol: "http",
        host: "localhost",
        port: 3000,
        cache: {
            "static": true,     // cache static files
            "response": true    // cache response by url
        }
    },
    "development": {        // development mode
        protocol: "http",
        host: "localhost",
        port: 3100,
        cache: {
            "static": false,
            "response": false
        }
    },
    // common parameters can be set without mode as well. 
    // In this case, parameters below, will be shared among development, and production mode.
    delimiters: '{{ }}',    // save delimiters for both modes
    compressOutput: true    // compress output html in response for both modes
};
```
## Project structure
```
apps/-|
      | your_app_dir/--|
                       | config/
                       | controllers/
                       | models/
                       | public/
                       | views/
                       | app.js // adittional app.js for your extra logic
node_modules/
app.js
```

### App structure explained
#### Config
Place your *.js configs inside. Example of config you can see above.
#### Controllers
Directory is used for controllers.

Lets take a look what we can do inside the controller:
```javascript
module.exports = function(client, db) {
    console.log( "Index controller was initialized!" );
    // handlers for different methods of request
    /**
     * client.get('/', function( req, res ) {})
     * client.post('/:id', function( req, res ) {})
     * client.put('/:id', function( req, res ) {})
     * client.patch('/:id', function( req, res ) {})
     * client.delete('/:id', function( req, res ) {})
     */
    client.get("/my/url/:id", function(req, res) {      
        // both variants available (it can return context and do res.end as well)
        /*res.writeHead(200, { "Content-Type": "text/plain" });
         res.end( "Hello World" );*/
        // render index.template from views 
        res.render("index", {
            partial: {  // context for index.template
                id: "myid"
            }, 
            title: "Title"   // will be passed to layout.template
        }, function() {});                  // if callback function as third param - no rendering into layout, just compiled view
        // return {};
    });

    client.get("/json/:id", function(req, res, next) {     // send json
        res.json({ id: req.params.id, 'title': "title" });  // send json in your own format
    });

    client.get("/:id/:title", function(req, res, next) {     // next function - e.g. is used for handling async requests
        next({ id: req.params.id, "title": req.params.title });     // without rendering of the partial, data context goes direct to layout
    });

    client.get("/get/news.json", function(req, res) {
        res.send({ id: 1, title: "title" }); // send json in common format
    });

    client.get("/get/error/404", function(req, res) {
        res.send(404);      // send 404 error code
    });
};
```

Basically, urls parsing is implemented in well-known `express` style.

To be continued...
