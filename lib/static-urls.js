var Promise = require('promised-io/promise').Promise,
    fs      = require('fs'),
    crypto  = require('crypto');

function generatePrefix (path) {

    var generated = new Promise(),
        shasum    = crypto.createHash('sha1');

    var stream = fs.ReadStream(path);

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

exports.generatePrefix = generatePrefix;

