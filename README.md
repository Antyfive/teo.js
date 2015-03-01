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
node_modules/
app.js
```
