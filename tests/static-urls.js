var litmus  = require('litmus'),
    fs      = require('fs');

exports.test = new litmus.Test('static-urls.js', function () {
    
    var staticUrls = require('../lib/static-urls'),
        test       = this;
    
    this.plan(8);

    var fixtureRoot  = __dirname + "/fixtures/static", 
        fixtureFile1 = fixtureRoot + "/style.css",
        fixtureFile2 = fixtureRoot + "/script.js";

    fileWrite(fixtureFile1, "hello world");
    fileWrite(fixtureFile2, "I am some script");

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


    test.async('multiple files', function (handle) {

        staticUrls.generatePrefix([fixtureFile1, fixtureFile2]).then(function (prefix) {

            test.is(
                typeof prefix,
                "string",
                "generatePrefix returns a string for multiple files"
            );

            var previous_prefix = prefix;
            fileWrite(fixtureFile1, "hello worl");

            staticUrls.generatePrefix([fixtureFile1, fixtureFile2]).then(function (prefix) {

                test.not(
                    prefix,
                    previous_prefix,
                    "generatePrefix returns a different string when one of the files change"
                );

                handle.resolve();
            });
        });
    });

    test.async('generatePrefixForPath', function (handle) {

        staticUrls.generatePrefixForPath(fixtureRoot).then(function (prefix) {

            test.is(
                typeof prefix,
                "string",
                "generatePrefixForPath returns a string for multiple files"
            );

            var previous_prefix = prefix;

            staticUrls.generatePrefixForPath(fixtureRoot + "/subdirectory").then(function (prefix) {

                test.not(
                    prefix,
                    previous_prefix,
                    "generatePrefixForPath returns a different string for a different file path"
                );

                handle.resolve();
            });
        });
    });
    
    test.async('listFiles', function (handle) {

        staticUrls.listFiles(fixtureRoot).then(function (files) {

            test.is(files.length, 4, "listFiles lists files in a path");
            test.is(
                files,
                [
                    fixtureRoot + "/script.js",
                    fixtureRoot + "/style.css",
                    fixtureRoot + "/subdirectory/other.js",
                    fixtureRoot + "/subdirectory/another/test.css"
                ],
                "Expected files were found"
            );

            handle.resolve();
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