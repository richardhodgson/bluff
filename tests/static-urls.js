var litmus  = require('litmus'),
    fs      = require('fs');

exports.test = new litmus.Test('static-urls.js', function () {
    
    var staticUrls = require('../lib/static-urls'),
        test       = this;
    
    this.plan(2);

    var fixtureFile1 = __dirname + "/fixtures/static/style.css"

    fileWrite(fixtureFile1, "hello world");

    test.async('single file', function (handle) {

        staticUrls.generatePrefix(fixtureFile1).then(function (prefix) {

            test.is(
                typeof prefix,
                "string",
                "generatePrefix returns a string"
            );

            var previous_prefix = prefix;
            fileWrite(fixtureFile1, "hello worl");

            staticUrls.generatePrefix(fixtureFile1).then(function (prefix) {

                test.not(
                    prefix,
                    previous_prefix,
                    "generatePrefix returns a different string when the file changes"
                );

                handle.resolve();
            });
        });
    });
});

function fileWrite (path, contents) {
    fs.writeFile(path, contents, function(err) {
        if(err) {
            test.fail(err);
            return;
        }
    });
}