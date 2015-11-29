#!/bin/sh
echo "Creating necessary folders..."
mkdir $3/apps
mkdir $3/apps/$1
mkdir $3/config

echo "Creating" $1 "app."
cp -r $2/apps/$1 $3/apps
echo "Done!"