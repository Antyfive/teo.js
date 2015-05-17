# Teo.js
[![Travis Build Status](https://travis-ci.org/Antyfive/teo.js.svg)](https://travis-ci.org/Antyfive/teo.js)
[![GitHub issues](https://img.shields.io/github/issues/Antyfive/teo.js.svg)](https://github.com/Antyfive/teo.js/issues)
[![npm version](https://badge.fury.io/js/teo.js.svg)](http://badge.fury.io/js/teo.js)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/Antyfive/teo.js/master/LICENSE)

[![NPM](https://nodei.co/npm/teo.js.png?downloads=true&stars=true)](https://nodei.co/npm/teo.js/)

Please, meet yet another Node.js based web-framework.

## Installing the framework

#### NPM
`npm install teo.js -g`

#### Clone git repo
`git clone https://github.com/Antyfive/teo.js.git`

# Setup

#### Create test project
* `mkdir myproject`
* `cd myproject/`
* `npm install teo.js` (or alternatevly, `npm install teo.js -g` to setup package globally )
* `teo setup dev` (will setup, and generate new project)

If `teo` executable is not working, update your PATH variable:

`export PATH="$PATH:./node_modules/.bin"`

#### Config
So, how to create config, which will be applied to your app?
In home directory of your application, just create `config` directory, and place inside your `*.js` file.
##### Here is default set of currently available properties:
```javascript
    protocol: "http",                       // as for version 0.1.0, only http is available
    host: "localhost",                      // your host
    port: 3000,                             // port
    delimiters: '{{ }}',                    // template engine delimiters
    cache: {
        "static": false,                    // cache static files
        "response": false                   // cache response by url
    },
    appDirs: ["models", "controllers"],     // app's directories to read and collect files inside, on system start
    appFiles: ["app.js"],                    // app's additional files to read and cache on system start
    cookie: {
        keys: ["signed key"]    // default signed key
    },
    session: {
        sessionKeyName: "SID",
        secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        lifetime: {
            session: 60 * 60 * 24 * 10 // in seconds, ten days by default
        },
        storageType: "memory" // only memory storage type at the moment
    },
    csrf: {
        keyName: "_csrfToken",
        secret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    },
    cluster: {  // enable usage of cluster
        enabled: true
    },
    db: {   // DB config
        enabled: false,
        // name of external ORM module
        ormName: "waterline",
        // teo.js ORM adapter
        // currently, all adapters are placed inside framework
        adapterName: "teo.db.adapter.waterline",
        // Build adapter config
        adapterConfig: {
            // each teo.js ORM can have each own adapters related to the particular third party ORM
            adapters: {
                // adapters should be installed as packages via npm
                "default": "sails-disk",
                disk: "sails-disk",
                mysql: "sails-mysql"
            },
            // Connections Config
            // Setup connections using the named adapter configs
            connections: {
                myLocalDisk: {
                    adapter: "disk"
                },
                myLocalMySql: {
                    adapter: "mysql",
                    host: "localhost",
                    database: "foobar"
                }
            }
        }
    }
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
    delimiters: '{{ }}'    // save delimiters for both modes
};
```
# Project structure
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

# App structure explained
## Config
Place your *.js configs inside. Example of config you can see above.
## Controllers
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

## res
Let's go through current `res` mixins.

### res.render
#### (templateName, contextObj, [callback])
```javascript
res.render("index", { 
    partial: {  // partial context will be passed into index.template
        id: "test"
    }, 
    title: "Title"  // context will be passed to layout.template
}, function(err, output) { // if callback function as third argument - no layout rendering, just partial
    
});                                     
```
With that said, if callback wasn't passed, framework will do `res.end` with compiled output (layout with partial).
### res.json
#### (obj)
Ends response with json, in your **own format** of response. Otherwise, framework will provide standartized format of json response. We will discuss it in next chapters.
```javascript
res.json({test: "test"}); // Content-Type will be set to "application/json"
```
### res.send
#### (repsonse) || (errCode, message)
This method commonly used to end your response. If you want to send JSON, you don't need to use `JSON.stringify`. Just pass object:
```javascript
res.send({myVal: "1"});
```
Content-Type will be matched automatically inside.

#### How Content-Type is set inside `res.send` method?
It can be detected in next ways:
* Based on `Accept` header from request.
* Based on extension from the url. I.e. `/my/action.json` extension will be parsed as `json`, and then `MIME` type will be matched.
* If object is passed, in this case `application/json` will be set.
* Otherwise, if `MIME` type is not found, `text/html` will be set.

#### Default response format using `res.send`

```javascript
// res.send({myVal: "1"}) // it will be sent in next format:
{
    code: code,     // response code
    data: {         // response object
        myVal: "1"
    },
    message: "string" // response message, based on http.STATUS_CODES
}
```
#### Sending an error with `res.send`
```javascript
res.send(500, "My error message");
```
Alternately, you can just send your response code. And response text will be matched in `http.STATUS_CODES`.
```javascript
res.send(500);
```
## req
Now, let's take a look on `req` mixins.
### req.cookie
Cookies are flavoured with https://github.com/pillarjs/cookies

Feel free to use it's api via `req.cookie`.

### req.session
Currently session have simple api, which consists of two methods:

#### req.session.set
##### (key, val)
Setter of value to the storage.
```javascript
req.session.set("myKey", "myVal");
```
#### req.session.get
##### (key)
Getter of value by key.
```javascript
var val = req.session.get("myKey");
```

### req.csrf
Basically CSRF is handled out of the box, and everything will be set, and handlerd on the level of framework. But, API is available as well.
#### req.csrf.genToken
##### ()
Generates token.

#### req.csrf.getToken
##### ()
Getter of token.
#### req.csrf.setToken
##### (key)
Setter of token.

#### req.csrf.generateHash
##### ()
Generates new hash.

### req.params
Object of parsed url params
```javascript
client.get('/get/:id', function(req, res) {
    cosole.log("My id:" + req.params.id);
});
```
### req.query
Object of parsed GET parameters
`http://localhost:3100/?myParam=1&myParam2=2`
Will parse it to `req.query` object:
```javascript
{
    "myParam": "1",
    "myParam2": "2"
}
```
## Database
Config example:

```javascript
db: {
        enabled: true,
        ormName: "waterline",
        // teo.js orm adapter
        adapterName: "teo.db.adapter.waterline",
        // Build adapter config
        adapterConfig: {
            // each teo.js ORM can have each own adapters related to the particular third party ORM
            adapters: {
                // adapters should be installed as packages via npm
                "default": "sails-disk",
                disk: "sails-disk",
                mysql: "sails-mysql"
            },
            // Connections Config
            // Setup connections using the named adapter configs
            connections: {
                myLocalDisk: {
                    adapter: "disk"
                },
                myLocalMySql: {
                    adapter: "mysql",
                    host: "localhost",
                    database: "foobar"
                }
            }
        }
    }
```
Scheme how ORM works:
`DB client -> ORM wrapper for particular external ORM -> Teo.js ORM Adapter`
All DB-related work is done by framework in background. Models will be loaded, and DB will be connected on Application start.

The only thing you need, is to manually **install** external ORM, and adapters.

Db client is available in every controller, and in your app.js  (Considering, you have `./apps/your_app/app.js` file).

### Example of controller with usage of db
```javascript
// model (./apps/your_app/models/users.js)
module.exports = {
    identity: 'users',
    connection: 'myLocalDisk',

    attributes: {
        first_name: 'string',
        last_name: 'string'
    }
};
// controller (./apps/your_app/controllers/users.js) 
module.exports = function(client, db) { // client, and db
    client.get("/users", function(req, res) {
        db.collection("users").find().exec(function(err, models) {
            if (err) {
                return res.send(500, err.message);
            }
            res.send(models.toJSON());
        });
    });
}
```
As for now, the fist ORM wrapper, and adapter is implemented for **Waterline**.

## Main API methods of DB client

#### db.collection
##### (stringName)
Getter of collection by it's name.

#### db.collections
##### ()
Getter of all loaded collections hash.

#### db.connect
##### (callbackFn)

Connect to DB.

#### db.disconnect
##### (callbackFn)

Disconnect from DB.

## Middleware
Middleware is implemented in `express` style.
Considering, you have `./apps/your_app/app.js` file:
```javascript
module.exports = function(client) {
    // you'll receive app context here
    this.middleware(function(req, res, next) {
        // examples of next() usage
        // next(403); // ends response with code 403
        // next("Body message"); // ends response with passed message, and 500 code (default)
        // next(403, "Not authorized"); // ends response with code, and error message
        // next(); // everything is fine
    });
}
```
**Attention!** Default status code is set to **500**.

## Logger
* `success(msg)`
* `info(msg)`
* `warn(msg)`
* `error(msg)`
* `fatal(msg)`
* `log(msg)`

Each log message type has it's own output color.

`logger.log("Message")` outputs in format:
`[Thu Mar 19 2015 10:11:12 GMT] Success: Message`

## Extensions

Framework supports external extensions.

Extensions can be loaded into the system as externally installed npm **modules**, or as **local** files (your own local extensions).

#### Extensions config
```javascript
extensions: {
        // Path to local extensions directory. i.e. /your_home_dir/extensions/my_extension
        filePath: "/extensions",
        extensionsList: [
            {
                "name": "powered-by",   // name in registry of extensions
                "module": "teo-powered-by-extension"    // npm module
            },
            {
                "name": "html-compressor",
                // local file name. Framework will be looking for /your_home_dir/extensions/myCompressor.js
                "file": "myCompressor" 
            }
        ]
    }
```
#### Extension example
```javascript
module.exports = {
    extension: function(app) {  // app API is passed inside extension
        // use 'app' or 'this' (extension function is called in app's context)
        app.middleware(function(req, res, next) {
            res.setHeader("X-Powered-By", "Teo.js v" + version);
            next();
        });
    }
};
```
To be continued...
