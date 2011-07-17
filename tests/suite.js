var litmus = require('litmus');

exports.test = new litmus.Suite('Bluff Test Suite', [
    require('./webapp').test,
    require('./generator').test
]);