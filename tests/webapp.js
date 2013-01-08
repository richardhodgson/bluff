var litmus  = require('litmus'),
    Promise = require('promised-io/promise').Promise;
    after   = require('promised-io/promise').all;

/**
* Mock a JSGI request object
* @param method e.g 'GET', 'POST' etc
* @param url The url that was called e.g. '/some/path'
* @param body An object of body params (use with POST)
*/
function mockRequest (method, url, body) {
    var request      = {};
    request.method   = method;
    request.pathInfo = url;
    
    if (body) {
        var param, params = [];
        for (param in body) {
            params.push(param + '=' + body[param]);
        }
        
        params = params.join("&");
        
        request.body = {};
        request.body.forEach = function (callback) {
            var done = new Promise;
            callback(params);
            done.resolve();
            return done;
        };
    }
    
    return request;
}

exports.test = new litmus.Test('webapp.js', function () {

    var Webapp = require('../lib/webapp').WebApp;

    this.plan(18);
    
    this.async("loading the homepage", function (handle) {
        
        var bluff = new Webapp(),
            test  = this;
        
        bluff.handle(
            mockRequest('GET', "/new")
        ).then(function (response) {
            
            test.is(200, response.status, "/new returns a 200");
            test.ok(response.body[0].match(/Bluff<\/a><\/h1>/), "homepage has bluff title");
            handle.resolve();
        });
    
    });
    
    this.async("loading the supported tags page", function (handle) {
        
        var bluff = new Webapp(),
            test  = this;
        
        bluff.handle(
            mockRequest('GET', "/supported-tags")
        ).then(function (response) {
            
            test.is(200, response.status, "/supported-tags returns a 200");
            test.ok(response.body[0].match(/<h2>Supported\sTags/i), "page has supported tags title");
            handle.resolve();
        });
    
    });

    this.async("creating a new presentation", function (handle) {
        
        var bluff = new Webapp(),
            test  = this;
        
        bluff.handle(
            mockRequest('POST', "/new", {body: 'a test slide'})
        ).then(function (response) {
            
            test.is(response.status, 302, "creating a new presentation will redirect");
            test.ok(response.headers.Location, "response contains location header to redirect to");
            
            // follow the redirect
            bluff.handle(
                mockRequest('GET', response.headers.Location)
            ).then(function (response) {
                test.is(response.status, 200, "new presentation is viewable");
                test.ok(response.body[0].match(/a test slide/), "presentation contains the expected slide contents");
                handle.resolve();
            });
        });
    });

    this.async("test 404s", function (handle) {

        var bluff = new Webapp(),
            test  = this,
            isPageNotFound = function (url, message) {
                return bluff.handle(mockRequest('GET', "/p/blahblah")).then(function (response) {
                    test.is(response.status, 404, message);
                });
            };
        
        after(
            isPageNotFound("/p/blahblah", "viewing a presentation that doesn't exist returns a 404"),
            isPageNotFound("/p/blahblah/edit", "editing a presentation that doesnt exist returns a 404")
        ).then(function () {
            handle.resolve();
        });
    });
    
    this.async("editing a presentation", function (handle) {

        var bluff = new Webapp(),
            test  = this;
        
        bluff.handle(
            mockRequest('POST', "/new", {body: 'a test slide'})
        ).then(function (response) {

            var url = response.headers.Location;
            
            test.ok(url, "created a new presentation to edit");
            
            // follow the redirect
            bluff.handle(
                mockRequest('GET', url)
            ).then(function (response) {
                test.is(response.status, 200, "new presentation is viewable");

                // click the edit link
                bluff.handle(
                    mockRequest('GET', url + '/edit')
                ).then(function (response) {
                    
                    test.ok(response.body[0].match(/form action/), "presentation can be edited");

                    // change something and save
                    bluff.handle(
                        mockRequest('POST', url + '/edit', {body: 'something new'})
                    ).then(function (response) {

                        test.nok(response.body[0].match(/a test slide/), "edit area doesn't contain the old contents");
                        test.ok(response.body[0].match(/something new/), "edit area contains the new slide contents");
                        
                        bluff.handle(
                            mockRequest('GET', url)
                        ).then(function (response) {

                            test.nok(response.body[0].match(/a test slide/), "presentation doesn't contain the old contents");
                            test.ok(response.body[0].match(/something new/), "presentation contains the new slide contents");
                            handle.resolve();
                        });
                    });
                });
            });
        });
    });

    this.async("editing a presentation with password", function (handle) {

        var bluff = new Webapp(),
            test  = this;
        
        bluff.handle(
            mockRequest('POST', "/new", {body: 'a test slide'})
        ).then(function (response) {

            var url = response.headers.Location;
            
            // follow the redirect
            bluff.handle(
                mockRequest('GET', url)
            ).then(function (response) {

                // click the edit link
                bluff.handle(
                    mockRequest('GET', url + '/edit')
                ).then(function (response) {
                    
                    // change something and save
                    bluff.handle(
                        mockRequest('POST', url + '/edit', {body: 'something new', password: 'psst'})
                    ).then(function (response) {

                        // change something and save
                        bluff.handle(
                            mockRequest('POST', url + '/edit', {body: 'something else new', password: 'psst'})
                        ).then(function (response) {
                            test.ok(response.body[0].match(/something else new/), "presentation can be edited with password");
                            handle.resolve();
                        });
                    });
                });
            });
        });
    });
  
});