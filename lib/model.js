var mongoose = require('mongoose'),
    Promise  = require('promised-io/lib/promise').Promise,
    crypto   = require('crypto'),
    markdown = require('markdown').markdown

mongoose.connect('mongodb://localhost/bluff');

var Schema   = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var PresentationSchema = {
	body: String,
	body_rendered: String,
	updated: Date,
	created: Date,
	slug: {type: String, index: { unique: true }}
}

var PresentationModel = new Schema(PresentationSchema);

PresentationModel.pre('save', function (next) {
	if (this.isNew) {
		this.set('created', new Date())
	}
	this.set('updated', new Date());
	
	this.set('body', this.body.replace(/[\r]/g, ""))
	this.set('body_rendered', markdown.toHTML(this.body));
	next();
});

PresentationModel.pre('save', function (next) {
	if (this.isNew) {
		self = this
		generateSlug().then(function (slug) {
			self.set('slug', slug)
			next()
		})
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
	
	var generated = new Promise(),
		hash      = crypto.createHash("sha1");
	
    Presentation.count({}, function (err, count) {
    	hash.update("slug" + count);
   		var hashed = hash.digest('hex');
   		
   		generated.resolve(hashed.substring(0, 5))
    })
    
    setTimeout(function () {
    	generated.reject();
    	throw new Error("generate slug timeout")
    }, 2000);
    
    return generated
}