var Promise   = require('promised-io/promise').Promise,
    crypto    = require('crypto'),
    generator = require('./generator'),
    base62    = require('base62'),
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
        console.log('bluff: using ' + lianPath + ' to connect to mongo at ' + mongoHost);
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
    getLian()(this, 'presentation', {
        'unique': ['slug'],
        'before': {
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
        }
    });
}

Presentation.getBySlug = function (slug) {
    var presentation = new Presentation();
    presentation.slug = slug;
    return presentation.findOne();
}


/**
 * Generate the slug that appears in urls.
 * 
 * Ids consist of pad(int),presentation count(int) and are base62 encoded.
 * 
 * The count could be out of date, so use a padding that is incremented in memory
 * to avoid conflicts. The padding is a 2 digit integer (10 - 99 inclusive). It cannot start
 * with zero as this would be lost when converting to an integer for base62 encoding leading
 * to possible colisions. This means it can generate a maximum of 90 slugs before the
 * presentation count increments. 
 * 
 * Note: this restricts the app to running one instance at a time. Introducing a worker id would avoid this.
 * 
 * @throws An error when the amount of slugs it can generate per count is exceeded.
 * @throws An error when it took longer than 3 seconds to retrieve the count.
 * @return string
 */
var generateSlug = (function () {

    // create a set of strings to pad with.
    var pad = [];
    for (var i = 10; i < 100; i++) {
        pad.push(i);
    };

    var sequence = 0,
        maxConcurrency = pad.length;

    return function () {

        var generated = new Promise();

        var timeout = setTimeout(
            function () {
                generated.reject();
                throw new Error("generate slug timeout")
            },
            3000
        );
        
        Presentation.count().then(function (count) {

            if (sequence > maxConcurrency) {
                throw new Error('slug generation limit exceeded: cannot generate more than ' + maxConcurrency + ' slugs concurrently') ;
            }

            var id = "" + pad[sequence] + count;
            sequence++;

            id = base62.encode(parseInt(id));

            clearTimeout(timeout);
            generated.resolve(id);
        });
            
        return generated;
    }
})();

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