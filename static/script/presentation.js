define(["jquery"], function ($) {
	
	function Controller () {		
		this.view         = new View();
		this.presentation = new Presentation();
		
		this.attachListeners();
		this.view.selectSlide(1);
	}
	
	Controller.prototype.attachListeners = function () {
	
		var self = this,
		    key_rightarrow = 39,
		    key_leftarrow  = 37,
		    key_spacebar   = 32;
		
		var nextNavigation = this.view.getNavElements('next');
		nextNavigation.each(function (i) {
			$(this).bind('click', function (e) {
				self.nextSlide(e)
			});
		});
		
		var previousNavigation = this.view.getNavElements('previous');
		previousNavigation.each(function (i) {
			$(this).bind('click', function (e) {
				self.previousSlide(e)
			});
		});
		
		
		$(window).keydown(function (e) {
			var key = e.which;
			
			if (key == key_rightarrow) {
				e.preventDefault();
				self.nextSlide(e);
			}
			
			if (key == key_leftarrow) {
				e.preventDefault();
				self.previousSlide(e);
			}
			
			//console.log(key);
		});
	}
	
	Controller.prototype.nextSlide = function (e) {
		e.preventDefault();
		this.presentation.currentSlide++;
		this.view.selectSlide(this.presentation.currentSlide);
	}
	
	Controller.prototype.previousSlide = function (e) {
		e.preventDefault();
		this.presentation.currentSlide--;
		this.view.selectSlide(this.presentation.currentSlide);
	}
	
	function Presentation () {
		this.currentSlide = 1;
	}
	
	function View () {
		this.slides = $('.slide');
	}
	
	View.prototype.getNavElements = function (type) {
		if (type != 'next' && type != 'previous') {
			throw new Error("not a known nav type");
		}
		return this.slides.find('.' + type + 'Slide');
	}
	
	View.prototype.selectSlide = function (number) {
		window.location.hash = "slide" + number;
	}
	
	
	function setup () {
		new Controller();
	}
	
	$(setup);
});