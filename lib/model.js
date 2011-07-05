var mongoose = require('mongoose'),
    Promise  = require('promised-io/lib/promise').Promise,
    crypto   = require('crypto'),
    markdown = require('markdown').markdown

var mongoHost = 'mongodb://localhost/bluff';

mongoose.connect(mongoHost, function (err) {
    if (err) {
        if (err.code && err.code == 'ECONNREFUSED') {
            throw new Error("Could not connect to '" + mongoHost + "'");
        }
        else {
            console.log("Unknown error");
            console.log(err);
        }
    }
});


var Schema   = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var PresentationSchema = {
    body: String,
    body_rendered: String,
    updated: Date,
    created: Date,
    password: String,
    slug: {type: String, index: { unique: true }}
}

var PresentationModel = new Schema(PresentationSchema);


/**
 * Password checking
 */
PresentationModel.pre('save', function (next) { 
    if (this.isNew) {
        return next();
    }
    
    var password  = this.password,
        submitted = generateHash(this.submittedPassword);
    
    if (password) {
        
        if (password == submitted) {
            return next();
        }
        return next(new Error('passwords dont match'));
    }
    else {
        this.set('password', submitted);
        next();
    }
});

/*
 * Update updated and created dates
 */
PresentationModel.pre('save', function (next) {
    if (this.isNew) {
        this.set('created', new Date())
    }
    this.set('updated', new Date());
    next();
});

/**
 * Body sanitisation, markup pre-rendering
 */
PresentationModel.pre('save', function (next) { 
    this.set('body', this.body.replace(/[\r]/g, ""))
    this.set('body_rendered', renderMarkup(this.body));
    next();
});

/**
 * Automatic slug generation
 */
PresentationModel.pre('save', function (next) {
    if (this.isNew) {
        self = this
        generateSlug().then(function (slug) {
            self.set('slug', slug);
            next();
        })
    }
    else {
        next();
    }
});

mongoose.model('Presentation', PresentationModel);

Presentation           = mongoose.model('Presentation');
Presentation.getBySlug = function (slug) {

    var found = new Promise();

    Presentation.findOne({slug: slug}, function (err, result) {
        found.resolve(result);
    });
    
    return found;
}


exports.Presentation = Presentation

/**
 * Generate the slug that appears in urls
 * return string
 */
function generateSlug () {
    
    var generated = new Promise();

    var timeout = setTimeout(function () {
        generated.reject();
        throw new Error("generate slug timeout")
    }, 3000);
    
    Presentation.count({}, function (err, count) {
        var hashed = generateHash("slug" + count);
           
	   clearTimeout(timeout);
           generated.resolve(hashed.substring(0, 5))
    });
    
    
    return generated
}

/**
 * TODO refactor this out into smaller functions
 */
function renderMarkup (body) {
    body = body.replace(/[\r]/g, "");
    ast  = markdown.parse(body);
    
    if (ast[0] == 'markdown') {
        ast = ast.splice(1, ast.length);
    }
    
    // add a starting slide if needed
    if (ast[0][0] != 'hr') {
        ast.unshift(['hr'])
    }
    
    var slideAst = [],
        currentSlide = -1;
    for (var i = 0, l = ast.length; i < l; i++) {
        
        if (ast[i][0] == 'hr') {
            currentSlide++;
            
            // a <hr> denotes a new slide, so create a new div in the tree
            slideAst.push(
                [
                    'div',
                    {class: "slide", id: "slide" + (currentSlide + 1)}
                ]
            );
        }
        else {
            slideAst[currentSlide].push(ast[i]);
        }
    }
    
    // this could be done as part of the previous loop,
    // however more obvious what going on if left separated.
    for (var i = 0, l = slideAst.length; i < l; i++) {
        
        var navigation = [
            'para',
            {class: "navigation"},
        ];
        
        if ((i + 1) != l) {
            navigation.push(                
                [
                    'link',
                    {class: "nextSlide", href: "#slide" + (i+2)},
                    'next'
                ]
            );
        }
        
        if (i != 0) {
            navigation.push(                
                [
                    'link',
                    {class: "previousSlide", href: "#slide" + (i)},
                    'previous'
                ]
            );
        }
        
//        slideAst[i].splice(2, 0, navigation);
        slideAst[i].push(navigation);
        
        
    }
    
    slideAst.unshift(['markdown']);
    
    return markdown.renderJsonML(markdown.toHTMLTree(slideAst));
}

function generateHash (plain) {
    var hash = crypto.createHash("sha1");
    hash.update(mongoHost + plain);
    return hash.digest('hex');
}
