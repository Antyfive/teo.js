#!/bin/sh
echo "Creating necessary folders..."
mkdir $1/apps
mkdir $1/apps/test
mkdir $1/apps/test/config
mkdir $1/apps/test/controllers
mkdir $1/apps/test/models
mkdir $1/apps/test/public
mkdir $1/apps/test/public/css
mkdir $1/apps/test/public/js
mkdir $1/apps/test/views
mkdir $1/config

echo "Copying code into the test app"
cp $1/install/index.js $1/index.js
cp $1/install/templates/apps/test/config/config.js $1/apps/test/config/config.js
cp $1/install/templates/config/config.js $1/config/config.js
cp $1/install/templates/apps/test/controllers/index.js $1/apps/test/controllers/index.js
cp $1/install/templates/apps/test/models/index.js $1/apps/test/models/index.js
cp $1/install/templates/apps/test/public/css/main.css $1/apps/test/public/css/main.css
cp $1/install/templates/apps/test/public/js/app.js $1/apps/test/public/js/app.js
cp $1/install/templates/apps/test/views/layout.template $1/apps/test/views/layout.template
cp $1/install/templates/apps/test/views/index.template $1/apps/test/views/index.template

echo "Done!"