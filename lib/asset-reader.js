var Promise    = require('promised-io/promise').Promise,
    fs         = require('promised-io/fs'),
    sourceRoot = __dirname + '/../static';

function read (path) {
    return fs.readFile(sourceRoot + path, 'utf8');
}

exports.read = read;