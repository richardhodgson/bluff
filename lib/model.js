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

function prepareBody (ob) {
    ob.body = ob.body.replace(/[\r]/g, "");
    ob.body_rendered = generator.render(ob.body);
    return ob;
}

function hasValidPassword (ob) {
    var password = ob.password;

    if (! password) {
        return true;
    }

    var submitted = generateHash(ob.submittedPassword);

    return (password === submitted);
};


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

            ob = prepareBody(ob);

            generateSlug().then(function (slug) {
                ob.slug = slug;
                prepared.resolve();
            });

            return prepared;
        },
        'update': function (ob) {

            var canUpdate = new Promise();

            ob.updated = new Date();

            ob = prepareBody(ob);

            if (hasValidPassword(ob)) {
                canUpdate.resolve();
            }
            else {
                canUpdate.reject("passwords don't match");
            }

            return canUpdate;
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
