var micro        = require('micro'),
    spectrum     = require('spectrum'),
    mongoose     = require('mongoose'),
    Promise      = require('promised-io/promise').Promise,
    after        = require('promised-io/promise').all,
    model        = require('./model'),
    Presentation = model.Presentation,
    AssetReader  = require('./asset-reader.js');

var WebApp = exports.WebApp = micro.webapp(),
    get    = WebApp.get,
    post   = WebApp.post;

WebApp.prototype.init = function () {
    this.view = new spectrum.Renderer(__dirname + '/../views');
};

exports.WebApp.setLianPath = model.setLianPath;

WebApp.handleStatic(__dirname + '/../static');

get('/', function (request, response) {
    return redirect(response, "/new")
});

get('/:page', function (request, response, args) {
    
    var rendered = new Promise;
    
    this.view.render('/pages/'+ args.page +'.spv' , {}).then(
        function (output) {
            response.ok('text/html');
            rendered.resolve(output)
        },
        function (err) {
            console.log("/:page handler --" + err.message);
            rendered.resolve();
        }
    );
    
    return rendered;
});

post('/new', function (request, response, args) {
    
    var done      = new Promise(),
        getParams = getPostParamsFromRequest(request),
        pres      = new Presentation(),
        view      = this.view;
        
    getParams.then(function (params) {
        pres.body = params.body;

        pres.insert().then(function(pres) {
            done.resolve(redirect(response, "/p/" + pres.slug));
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

        if (pres == null) {
            return done.resolve();
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

        if (pres == null) {
            return done.resolve();
        }

        function render (viewData) {
            view.render('/edit.spv', viewData).then(function (output) {
                response.ok('text/html');
                done.resolve(output);
            });
        }
        
        getParams.then(function (params) {
            
            pres.body              = params.body;
            pres.submittedPassword = params.password;
            
            pres.update().then(
                function(pres) {
                    pres.submittedPassword = params.password;
                    viewData = {
                        pres: pres,
                        message: 'Saved at ' + model.formatDate(pres.updated)
                    };
                    render(viewData);
                },
                function (errorMessage) {
                    pres.submittedPassword = params.password;
                    viewData = {
                        pres: pres,
                        message: errorMessage
                    };
                    render(viewData);
                }
            );
        });
    });

    return done;
});

get('/p/:slug/download', function (request, response, args) {

    var rendered = new Promise(),
        pres     = Presentation.getBySlug(args.slug),
        view     = this.view;
        
    pres.then(function (pres) {
        
        if (pres == null) {
            return rendered.resolve();
        }
        
        after(
            AssetReader.read('/script/vendor/jquery-1.6.2.min.js'),
            AssetReader.read('/style/presentation.css'),
            AssetReader.read('/script/presentation.js')
        )
        .then(function (contents) {
            view.render(
                '/download.spv',
                {
                    pres: pres,
                    requireJquery: contents[0],
                    css:  contents[1],
                    js:   contents[2]
                }
            )
            .then(function (output) {
                response.ok('text/html');
                response._response.headers["Content-Disposition"] = 'attachment; filename=bluff-presentation-'+ pres.slug +'.html';
                rendered.resolve(output);
            });
        });
    });
    
    return rendered;
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