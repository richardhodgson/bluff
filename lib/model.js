var mongoose  = require('mongoose'),
    Promise   = require('promised-io/lib/promise').Promise,
    crypto    = require('crypto'),
    generator = require('./generator')

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
    this.set('body_rendered', generator.render(this.body));
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

function generateHash (plain) {
    var hash = crypto.createHash("sha1");
    hash.update(mongoHost + plain);
    return hash.digest('hex');
}

/**
 * Returns a date string in the format:
 *    Tuesday, July 05, 2011 19:10:38
 */
function formatDate (d) {
    
    return d.toLocaleDateString() + ' ' +
           d.toLocaleTimeString();
    /*
    return d.getDay() + '/' + d.getMonth() + '/' + d.getYear() + ' ' +
           d.getHours() + ':' + d.getMinutes();*/
}

exports.formatDate = formatDate;
// to make command testing easier...really, add some unit tests :p
//exports.renderMarkup = renderMarkup;