var Promise    = require('promised-io/promise').Promise,
    after      = require('promised-io/promise').all,
    fs         = require('promised-io/fs'),
    ReadStream = require('fs').ReadStream,
    crypto     = require('crypto');

var HASH_TYPE = 'md5'

function _generateHashForFile (path) {
    var generated = new Promise(),
        shasum    = crypto.createHash(HASH_TYPE),
        stream    = ReadStream(path);

    stream.on(
        'data',
        function(d) {
            shasum.update(d);   
        }
    );

    stream.on(
        'end',
        function() {
            generated.resolve(shasum.digest('hex'));
        }
    );

    return generated;
}

/*
 * Generate a static url prefix for a file or array of files.
 * @param string|array files String or array of files
 * @return string
 */
function generatePrefix (files) {

    if (typeof files == "string") {
        files = [files];
    }

    var generated       = new Promise(),
        generateHashes = [];

    for (var i = 0, l = files.length; i < l; i++) {
        generateHashes.push(_generateHashForFile(files[i]));
    }
    
    after(generateHashes).then(function (hashes) {
        var hash = crypto.createHash(HASH_TYPE);
        hash.update(hashes.join(""));
        generated.resolve(hash.digest('hex'));
    });

    return generated;
}


/*
 * Generate a static url prefix for files recursively found in path.
 * @param string files Path to directory of files.
 * @return string
 */
function generatePrefixForPath (path) {

    var generated = new Promise();

    listFiles(path).then(function (files) {
        generatePrefix(files).then(function (prefix) {
            generated.resolve(prefix);
        });
    });

    return generated;
}

function listFiles (directory) {

    var listed             = new Promise(),
        directoryRead      = new Promise(),
        directoriesChecked = [directoryRead];

    fs.readdir(directory).then(function (files) {
        
        var stats    = [],
            fileList = [];

        for (var i = 0, l = files.length; i < l; i++) {
            var file = directory + "/" + files[i];

            (function (file) {
                stats.push(
                    fs.stat(file).then(function (stat) {

                        if (stat && stat.isDirectory()) {
                            directoriesChecked.push(listFiles(file));
                        }
                        else {
                            fileList.push(file);
                        }
                    })
                );
            })(file);
        }

        after(stats).then(function () {
            directoryRead.resolve(fileList);
        });

    });

    directoryRead.then(function () {
        after(directoriesChecked).then(function (subdirectories) {
            subdirectories = [].concat.apply([], subdirectories);
            listed.resolve(subdirectories);
        });
    });

    return listed;
}

exports.generatePrefix        = generatePrefix;
exports.generatePrefixForPath = generatePrefixForPath;
exports.listFiles             = listFiles;
