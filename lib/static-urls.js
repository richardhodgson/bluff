var Promise = require('promised-io/promise').Promise,
    after   = require('promised-io/promise').all,
    fs      = require('fs'),
    crypto  = require('crypto');

var HASH_TYPE = 'md5'

function _generateHashForFile (path) {
    var generated = new Promise(),
        shasum    = crypto.createHash(HASH_TYPE),
        stream    = fs.ReadStream(path);

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
 * @param string|array paths String or array of file paths
 * @return string 
 */
function generatePrefix (paths) {

    if (typeof paths == "string") {
        paths = [paths];
    }

    var generated       = new Promise(),
        generateHashes = [];

    for (var i = 0, l = paths.length; i < l; i++) {
        generateHashes.push(_generateHashForFile(paths[i]));
    }
    
    after(generateHashes).then(function (hashes) {
        var hash = crypto.createHash(HASH_TYPE);
        hash.update(hashes.join(""));
        generated.resolve(hash.digest('hex'));
    });

    return generated;
}

exports.generatePrefix = generatePrefix;

