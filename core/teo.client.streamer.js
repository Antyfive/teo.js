/*!
 * Streamer
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 12/18/14
 */

var fs = require('fs');

// Middleware to stream video, audio with support for different formats and device request for chunks

/**
 * Streamer
 * @param {Object} req :: http req
 * @param {Object} res :: http res
 * @param {String} filePath :: path to file
 * @param {String} contentType
 */
exports.stream = function(req, res, filePath, contentType) {

    var streamPath = filePath;
    //Calculate the size of the file
    var stat = fs.statSync(streamPath);
    var total = stat.size;
    var file;

    // Chunks based streaming
    if (req.headers.range) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total - 1;
        var chunksize = (end - start) + 1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        file = fs.createReadStream(streamPath, {
            start: start,
            end: end
        });
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
        });
        res.openedFile = file;
        file.pipe(res);
    } else {
        console.log('ALL: ' + total);
        file = fs.createReadStream(streamPath);
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': contentType
        });
        res.openedFile = file;
        file.pipe(res);
    }

    res.on('close', function() {
        console.log('response closed');
        if (res.openedFile) {
            res.openedFile.unpipe(this);
            if (this.openedFile.fd) {
                fs.close(this.openedFile.fd);
            }
        }
    });

};
