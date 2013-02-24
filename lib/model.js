var Promise   = require('promised-io/promise').Promise,
    crypto    = require('crypto'),
    generator = require('./generator'),
    base62    = require('base62'),
    lian      = null,
    lianPath  = 'lian',
    mongoHost = null;

function createMongoConnectionString () {

    if (! process.env.BLUFF_DB_NAME) {
        throw new Error("bluff: no database name set in env, e.g. export BLUFF_DB_NAME=bluff");
    }
    var database = process.env.BLUFF_DB_NAME,
        host     = process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost',
        port     = process.env.OPENSHIFT_MONGODB_DB_PORT || '27017',
        username = process.env.OPENSHIFT_MONGODB_DB_USERNAME || null,
        password = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || null;

    var credentials = '';
    if (username && password) {
        credentials = username + ':' + password + '@';
    }

    return credentials + host + ':' + port + '/' + database;
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
 * Uses an incrementing number based on the current presentation count, which is queried at
 * start-up.
 * 
 * To avoid the stampeding herd effect, pending slug generation requests will be queued until
 * the count is retrieved from the DB.
 * 
 * Note: this restricts the app to running as a single instance. This could be solved by either
 * abstracting the seed logic into a separate HTTP service or building a locking mechanism;
 * where each instance reserves a number of seeds.
 * 
 * @return string
 */
var generateSlug = (function () {

    var countRequested = false,
        seed = null;

    return function () {

        var generated = new Promise(),
            resolve = function (seed) {
                generated.resolve(base62.encode(seed));
            }

        if (typeof seed === 'number') {
            seed++;
            resolve(seed);
            return generated;
        }

        var wait = setInterval(
            function () {
                if (typeof seed === 'number') {
                    clearInterval(wait);
                    seed++;
                    resolve(seed);
                }
            },
            50
        );

        if (! countRequested) {
            countRequested = true;

            var presentation = new Presentation();
            presentation.count().then(function (count) {
                seed = count;
            });
        }

        return generated;
    };

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