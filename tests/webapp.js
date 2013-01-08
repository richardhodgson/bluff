var litmus  = require('litmus'),
    Promise = require('promised-io/promise').Promise;

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

    // mongoose will hold the mongo connection indefinately
    // unless told otherwise.
    setTimeout(function () {
        require('mongoose').disconnect();
    }, 500);
    
    this.plan(8);
    
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
  
});