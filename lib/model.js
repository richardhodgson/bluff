var Promise   = require('promised-io/promise').Promise,
    crypto    = require('crypto'),
    generator = require('./generator');

function createMongoConnectionString () {

    var host     = process.env.OPENSHIFT_NOSQL_DB_HOST || 'localhost',
        port     = process.env.OPENSHIFT_NOSQL_DB_PORT || '27017',
        username = process.env.OPENSHIFT_NOSQL_DB_USERNAME || null,
        password = process.env.OPENSHIFT_NOSQL_DB_PASSWORD || null;

    var credentials = '';
    if (username && password) {
        credentials = username + ':' + password + '@';
    }

    return 'mongodb://' + credentials + host + ':' + port + '/bluff';
}
var mongoHost = createMongoConnectionString();

/**
 * Password checking
 */
/*
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
*/
/*
 * Update updated and created dates
 */
/*
PresentationModel.pre('save', function (next) {
    if (this.isNew) {
        this.set('created', new Date())
    }
    this.set('updated', new Date());
    next();
});
*/
/**
 * Body sanitisation, markup pre-rendering
 */
 /*
PresentationModel.pre('save', function (next) { 
    this.set('body', this.body.replace(/[\r]/g, ""))
    this.set('body_rendered', generator.render(this.body));
    next();
});
*/


var lian = require('lian/lib/mock')('localhost/mydb');

function setStore () {
    new Error("todo - override lian autoconnection?");
}

function Presentation () {
    lian(this, 'presentation', {'before': {
        'insert': function (ob) {

            var prepared = new Promise();

            ob.created = new Date();
            ob.updated = new Date();

            ob.body = ob.body.replace(/[\r]/g, "");
            ob.body_rendered = generator.render(ob.body);

            generateSlug().then(function (slug) {
                ob.slug = slug;
                prepared.resolve();
            });

            return prepared;
        },
        'update': function (ob) {
            ob.updated = new Date();
            return true;
        }
    }});

    // properties
    this.body     = null;
    this.slug     = null; // todo - this had a unique index on it...
    this.updated  = null;
    this.created  = null;
    this.password = null;
    this.body_rendered = null;
}

Presentation.getBySlug = function (slug) {

    var presentation = new Presentation();
    presentation.slug = slug;

    return presentation.findOne();
}


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
    
    var presentation = new Presentation();

    presentation.count().then(function (count) {
        var hashed = generateHash("slug" + count);
           
        clearTimeout(timeout);
        generated.resolve(hashed.substring(0, 5))
    });
        
    return generated
}

/**
 * Generates a SHA-1 hash
 * @return string
 */
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

exports.Presentation = Presentation
exports.formatDate = formatDate;
