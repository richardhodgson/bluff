var Promise    = require('promised-io/promise').Promise,
    fs         = require('promised-io/fs'),
    sourceRoot = __dirname + '/../static';

function read (path, encoding) {
    encoding = encoding || 'utf8';
    return fs.readFile(sourceRoot + path, encoding);
}

function convertToBase64 (promise) {
    var converted = new Promise();
    promise.then(function(contents){
        converted.resolve(new Buffer(contents, 'binary').toString('base64'));
    });
    return converted
}

exports.read = read;
exports.convertToBase64 = convertToBase64;