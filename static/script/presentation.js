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
			
			if (key == key_rightarrow ||
				key == key_spacebar) {
				self.nextSlide(e);
			}
			
			if (key == key_leftarrow) {
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
        
        var self = this;
        
        var updatePositioning = function () {
            self.setSlideHeightFromWindow();
            self.verticallyCentreSlideContents();
        };
        
        $(window).bind("resize", updatePositioning);
        $(window).bind("scroll", updatePositioning);
        
        this.wrapSlideContents();
        updatePositioning();
	}
	
    /**
     * Returns navigation elements for all slides
     * @param type For example, 'next' or 'previous
     * @return jQuery 
     */
	View.prototype.getNavElements = function (type) {
		if (type != 'next' && type != 'previous') {
			throw new Error("not a known nav type");
		}
		return this.slides.find('.' + type + 'Slide');
	}
	
    /**
     * Updates the hash in the window's location
     */
	View.prototype.selectSlide = function (number) {
		window.location.hash = "slide" + number;
	}
    
    /**
     * Sets the height for each slide to that of the window (viewport)
     */
    View.prototype.setSlideHeightFromWindow = function () {
        this.slides.height($(window).height());
    }
    
    /**
     * Wraps contents of each slide in a div
     * Div is used as a shortcut to work out total contents height
     */
    View.prototype.wrapSlideContents = function () {
        this.slides.each(function (i) {
            var slide = $(this),
                paragraphs = slide.find('p:not(.navigation)');
                
            paragraphs.wrapAll('<div class="slideContents"></div>');
            paragraphs.css({
                'marginTop': 0,
                'marginBottom': '3%'
            });
            
            var contentsGroup = slide.find('.slideContents');
            contentsGroup.css({
                'float': 'left',
                'width': '100%'
            });
        });
    }
    
    /**
     * Ensures the contents of the slide are vertically centred.
     */
    View.prototype.verticallyCentreSlideContents = function () {
        this.slides.each(function (i) {
            var slide = $(this),
                contentsGroup = slide.find('.slideContents');
            
            contentsGroup.css(
                'marginTop',
                (slide.height() - contentsGroup.height()) / 2
            );
        });
    }
	
	
	function setup () {
		new Controller();
	}
	
	$(setup);
});