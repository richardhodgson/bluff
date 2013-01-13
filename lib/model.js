var Promise   = require('promised-io/promise').Promise,
    crypto    = require('crypto'),
    generator = require('./generator'),
    lian      = null,
    lianPath  = 'lian',
    mongoHost = null;

function createMongoConnectionString () {

    var host     = process.env.OPENSHIFT_NOSQL_DB_HOST || 'localhost',
        port     = process.env.OPENSHIFT_NOSQL_DB_PORT || '27017',
        username = process.env.OPENSHIFT_NOSQL_DB_USERNAME || null,
        password = process.env.OPENSHIFT_NOSQL_DB_PASSWORD || null;

    var credentials = '';
    if (username && password) {
        credentials = username + ':' + password + '@';
    }

    return credentials + host + ':' + port + '/bluff';
}

function getLian () {
    if (! lian) {
        mongoHost = createMongoConnectionString();
        console.log('bluff: using mongo at ' + mongoHost);
        lian = require(lianPath)(mongoHost);
    }
    return lian;
}

function setLianPath (path) {
    lianPath = path;
}

function prepareBody (ob) {
    ob.body = ob.body.replace(/[\r]/g, "");
    ob.body_rendered = generator.render(ob.body);
    return ob;
}

function hasValidPassword (ob) {

    var password = ob.password,
        submitted;

    if (ob.submittedPassword) {
        submitted = generateHash(ob.submittedPassword);
        delete ob.submittedPassword;
    }
    if (password) {
        // password compare
        if (! submitted) {
            return false;
        }
        return (password === submitted)
    }
    else {
        // new password
        ob.password = submitted;
        return true;
    }
};

function Presentation () {
    getLian()(this, 'presentation', {'before': {
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
        },
        'findOne': function (ob) {
            for (var prop in ob) {
                var value = ob[prop];

                if (value == null) {
                    delete ob[prop];
                }
            }
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
exports.formatDate   = formatDate;
exports.setLianPath  = setLianPath