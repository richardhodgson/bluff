var micro        = require('micro'),
    spectrum     = require('spectrum'),
    mongoose     = require('mongoose'),
    Promise      = require('promised-io/lib/promise').Promise,
    Presentation = require('./model').Presentation;

var WebApp = exports.WebApp = micro.webapp(),
    get    = WebApp.get,
    post   = WebApp.post;

WebApp.prototype.init = function () {
    this.view = new spectrum.Renderer(__dirname + '/../views');
};

WebApp.handleStatic(__dirname + '/../static');

get('/', function (request, response) {
    return redirect(response, "/new")
});

get('/new', function (request, response) {
    return this.view.render('/index.spv', {}).then(function (output) {
        response.ok('text/html');
        return output;
    });
});

post('/new', function (request, response, args) {
    
    var done      = new Promise(),
        getParams = getPostParamsFromRequest(request),
        pres      = new Presentation,
        view      = this.view;
        
    getParams.then(function (params) {
        pres.body = params.body;
        
        pres.save(function(err) {
            done.resolve(redirect(response, "/p/" + pres.slug))
        });
    });
    
    return done;
});


get('/p/:slug', function (request, response, args) {

    var rendered = new Promise(),
        pres     = Presentation.getBySlug(args.slug),
        view     = this.view;
        
    pres.then(function (pres) {
        
        if (pres == null) {
            return rendered.resolve();
        }
        
        view.render('/view.spv', {pres: pres}).then(function (output) {
            response.ok('text/html');
            rendered.resolve(output);
        })        
    })
    
    return rendered;
});


get('/p/:slug/edit', function (request, response, args) {
    
    var done = new Promise();
        
    var pres = Presentation.getBySlug(args.slug),
        view = this.view;

    pres.then(function (pres) {
        
        if (! pres) {
            pres = new Presentation();
            pres.slug = args.slug;
        }
        
        view.render('/edit.spv', {pres: pres}).then(function (output) {
            response.ok('text/html');
            done.resolve(output);
        });
    });

    return done;    
});

post('/p/:slug/edit', function (request, response, args) {

    var done      = new Promise(),
        getParams = getPostParamsFromRequest(request),
        pres      = Presentation.getBySlug(args.slug),
        view      = this.view;
    
    pres.then(function (pres) {
        
        if (! pres) {
            return "";
        }
        
        getParams.then(function (params) {
            pres.body = params.body;
            pres.save(function(err) {
                view.render('/edit.spv', {pres: pres}).then(function (output) {
                    response.ok('text/html');
                    done.resolve(output);
                });
            });
        });
    });

    return done;
});

function getPostParamsFromRequest (request) {
    
    var done = new Promise,
        postParams = "";
    
    request.body.forEach(function (params) {
        postParams += params;
    })
    .then(function() {
        done.resolve(
            require("querystring").parse(postParams)
        );
    });
    
    return done;
}

function redirect (response, url) {
    response.setStatus(302);
    response._response.headers["Location"] = url;
    return "";
}