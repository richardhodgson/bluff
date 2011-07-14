var Promise    = require('promised-io/lib/promise').Promise,
    fs         = require('promised-io/lib/fs'),
    sourceRoot = __dirname + '/../static';

function read (path) {
    return fs.readFile(sourceRoot + path, 'utf8');
}

exports.read = read;