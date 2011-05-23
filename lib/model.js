var mongoose = require('mongoose'),
    Promise  = require('promised-io/lib/promise').Promise;

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
    // TODO generate slug?
	if (this.isNew) {
		this.set('created', new Date());
	}
	this.set('updated', new Date());
	
	this.body = this.body.replace(/[\r]/g, "")
	//this.body_rendered = require('markdown').markdown.toHTML(this.body);
	
	next();
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