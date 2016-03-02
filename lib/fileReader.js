/*!
 * File reader
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/7/15
 */

"use strict";

const fs = require("fs");

module.exports = {
    /**
     * Checks paths, and reads static file
     * @param {String} filePath
     * @param {Function} callback
     */
    readFileSafely(filePath, callback) {
        try {
            filePath = decodeURIComponent(filePath);    // decode url
        } catch(e) {
            callback(e);
            return;
        }

        if (~filePath.indexOf("\0")) {  // zero byte
            callback(new Error("Zero byte error"));
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err) {
                callback(err);
                return;
            }

            if (!stats.isFile()) {
                callback(new Error("Not a file was found"));
                return;
            }

            this.readFile(filePath, (err, dataBuffer) => {
                if (err) {
                    callback(err);
                    return;
                }

                callback(null, dataBuffer);
            });
        });
    },

    /**
     * Reads file
     * @param {String} path
     * @param callback
     * @private
     */
    readFile(path, callback) {
        let readStream = new fs.ReadStream(path/*, {encoding: "utf-8"}*/);
        let data = [];

        readStream.on("readable", () => {
            let read = readStream.read();
            if (read != null) {
                data.push(read);
            }
        });

        readStream.on("error", (err) => {
            logger.error(err);
            callback(err);
        });

        readStream.on("end", () => {
            callback(null, Buffer.concat(data));
        });
    }
};