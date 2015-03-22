#!/bin/sh
echo "Creating necessary folders..."
mkdir $2/apps
mkdir $2/apps/test
mkdir $2/apps/test/config
mkdir $2/apps/test/controllers
mkdir $2/apps/test/models
mkdir $2/apps/test/public
mkdir $2/apps/test/public/css
mkdir $2/apps/test/public/js
mkdir $2/apps/test/views
mkdir $2/config

echo "Copying code into the test app"
cp $1/templates/index.js $2/index.js
cp $1/templates/apps/test/config/config.js $2/apps/test/config/config.js
cp $1/templates/config/config.js $2/config/config.js
cp $1/templates/apps/test/app.js $2/apps/test/app.js
cp $1/templates/apps/test/controllers/index.js $2/apps/test/controllers/index.js
cp $1/templates/apps/test/models/index.js $2/apps/test/models/index.js
cp $1/templates/apps/test/public/css/main.css $2/apps/test/public/css/main.css
cp $1/templates/apps/test/public/js/app.js $2/apps/test/public/js/app.js
cp $1/templates/apps/test/views/layout.template $2/apps/test/views/layout.template
cp $1/templates/apps/test/views/index.template $2/apps/test/views/index.template
echo "Done!"