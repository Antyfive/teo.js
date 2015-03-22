#!/bin/sh
echo "Creating necessary folders..."
mkdir $3/apps
mkdir $3/apps/$1
mkdir $3/apps/$1/config
mkdir $3/apps/$1/controllers
mkdir $3/apps/$1/models
mkdir $3/apps/$1/public
mkdir $3/apps/$1/public/css
mkdir $3/apps/$1/public/js
mkdir $3/apps/$1/views
mkdir $3/config

echo "Creating" $1 "app."
cp $2/app.js $3/app.js
cp $2/apps/$1/config/config.js $3/apps/$1/config/config.js
cp $2/config/config.js $3/config/config.js
cp $2/apps/$1/app.js $3/apps/$1/app.js
cp $2/apps/$1/controllers/index.js $3/apps/$1/controllers/index.js
cp $2/apps/$1/models/index.js $3/apps/$1/models/index.js
cp $2/apps/$1/public/css/main.css $3/apps/$1/public/css/main.css
cp $2/apps/$1/public/js/app.js $3/apps/$1/public/js/app.js
cp $2/apps/$1/views/layout.template $3/apps/$1/views/layout.template
cp $2/apps/$1/views/index.template $3/apps/$1/views/index.template
echo "Done!"