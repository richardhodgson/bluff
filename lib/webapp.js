var micro        = require('micro'),
    spectrum     = require('spectrum'),
    Promise      = require('promised-io/promise').Promise,
    after        = require('promised-io/promise').all,
    model        = require('./model'),
    Presentation = model.Presentation,
    AssetReader  = require('./asset-reader.js'),
    proton       = require('proton'),
    fs           = require('promised-io/fs'),
    staticUrls   = require('./static-urls');

var WebApp = exports.WebApp = micro.webapp(),
    get    = WebApp.get,
    post   = WebApp.post;

/*
TODO
 - first request always hasn't computed this
 - render method for all handlers
*/
var STATIC_FS_PATH = __dirname + '/../static',
    STATIC_PREFIX  = '';

listFiles(STATIC_FS_PATH).then(function (files) {
    staticUrls.generatePrefix(files).then(function (prefix) {
        STATIC_PREFIX = "/static/" + prefix;
        handleStatic(WebApp, STATIC_FS_PATH, STATIC_PREFIX);
    });
});

WebApp.prototype.init = function () {
    this.view = new spectrum.Renderer(__dirname + '/../views');
};

exports.WebApp.setLianPath = model.setLianPath;

// see below for shim to handle font files
//WebApp.handleStatic(__dirname + '/../static');
//handleStatic(WebApp, __dirname + '/../static');

get('/', function (request, response) {
    return redirect(response, "/new")
});

get('/:page', function (request, response, args) {
    
    var rendered = new Promise;
    
    render(this.view, '/pages/'+ args.page +'.spv').then(
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
            AssetReader.read('/script/vendor/impress.js'),
            AssetReader.read('/style/presentation.css'),
            AssetReader.read('/script/presentation.js'),
            AssetReader.convertToBase64(
                AssetReader.read('/style/font/pt_sans-narrow-web-bold.eot', 'binary')
            ),
            AssetReader.convertToBase64(
                AssetReader.read('/style/font/pt_sans-narrow-web-bold.ttf', 'binary')
            ),
            AssetReader.convertToBase64(
                AssetReader.read('/style/font/pt_sans-narrow-web-bold.woff', 'binary')
            )
        )
        .then(function (contents) {
            view.render(
                '/download.spv',
                {
                    pres: pres,
                    jquery: contents[0],
                    impress: contents[1],
                    css:  contents[2],
                    js:   contents[3],
                    eot: contents[4],
                    ttf: contents[5],
                    woff: contents[6]
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

function render (view, templateName, viewData) {
    viewData = viewData || {};
    viewData['staticPrefix'] = STATIC_PREFIX;
    return view.render(templateName, viewData);
}

// needed until there is micro support for font files
function handleStatic (WebApp, root, prefix) {
    
    var types = {
        'eot'  : 'font/eot',
        'otf'  : 'font/otf',
        'ttf'  : 'font/ttf',
        'woff' : 'font/woff',
        'png'  : 'image/png',
        'jpg'  : 'image/jpeg',
        'jpeg' : 'image/jpeg',
        'gif'  : 'image/gif',
        'svg'  : 'image/svg+xml',
        'css'  : 'text/css',
        'js'   : 'text/javascript',
        'swf'  : 'application/x-shockwave-flash',
        'html' : 'text/html'
    };

    if (! root) {
        throw new Error('missing root directory for static files');
    }
    if (! prefix) {
        prefix = '';
    }
    prefix = prefix.replace(/([^\w])/g, '\\$1');
    var realRoot  = fs.realpath(root),
        realPaths = {},
        notFound  = function (response) {
            return function (err) {
                response.notFound('text/plain');
                return 'not found';
            };
        };
    proton.beforeStart(WebApp, realRoot.then(
        function (root) {
            WebApp.get(new RegExp('^' + prefix + '(.+\\.(css|js|jpe?g|gif|png|swf|html|eot|otf|svg|ttf|woff))$'), function (request, response, path, type) {
                var path = root + path;
                if (! (path in realPaths)) {
                    realPaths[path] = fs.realpath(path);
                }
                return realPaths[path].then(
                    function (assetPath) {
                        return fs.readFile(assetPath).then(
                            function (contents) {
                                response.setStatus(200);
                                response.setType(types[type]);
                                return contents;
                            },
                            notFound(response)
                        );
                    },
                    notFound(response)
                );
            });
        },
        function (err) {
            throw new Error('cannot add static handler for "' + root + '": ' + err.message);
        }
    ));
};


function listFiles (directory) {

    var listed             = new Promise(),
        directoryRead      = new Promise(),
        directoriesChecked = [directoryRead];

    fs.readdir(directory).then(function (files) {
        
        var stats    = [],
            fileList = [];

        for (var i = 0, l = files.length; i < l; i++) {
            var file = directory + "/" + files[i];

            (function (file) {
                stats.push(
                    fs.stat(file).then(function (stat) {

                        if (stat && stat.isDirectory()) {
                            directoriesChecked.push(listFiles(file));
                        }
                        else {
                            fileList.push(file);
                        }
                    })
                );
            })(file);
        }

        after(stats).then(function () {
            directoryRead.resolve(fileList);
        });

    });

    directoryRead.then(function () {
        after(directoriesChecked).then(function (subdirectories) {
            subdirectories = [].concat.apply([], subdirectories);
            listed.resolve(subdirectories);
        });
    });

    return listed;
}