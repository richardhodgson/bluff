define(["jquery", "./vendor/impress.js"], function ($) {
    
    function Controller () {
        /*
        this.view         = new View();
        this.presentation = new Presentation();
        
        this.presentation.totalSlides = this.view.countSlides();
        
        this.attachListeners();
        this.view.selectSlide(1);
        */

        this.view = new CircleView();
    }
    
    Controller.prototype.attachListeners = function () {
    
        var self = this,
            keys = {
                'rightarrow': 39,
                'leftarrow' : 37,
                'spacebar'  : 32,
                'backspace' : 8 
            };
        
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
            
            if (key == keys.rightarrow ||
                key == keys.spacebar) {
                self.nextSlide(e);
            }
            
            if (key == keys.leftarrow ||
                key == keys.backspace) {
                self.previousSlide(e);
            }
            
            //console.log(key);
        });
        
        $('body').bind('click', function (e) {
            var target = $(e.target).parent();
            
            if (! target.hasClass('actions')) {
                self.nextSlide(e);
            }
        });
    }
    
    Controller.prototype.nextSlide = function (e) {
        e.preventDefault();
        if (this.presentation.currentSlide == this.presentation.totalSlides) {
            return;
        }
        this.presentation.currentSlide++;
        this.view.selectSlide(this.presentation.currentSlide);
    }
    
    Controller.prototype.previousSlide = function (e) {
        e.preventDefault();
        if (this.presentation.currentSlide == 1) {   
            return;
        }
        this.presentation.currentSlide--;
        this.view.selectSlide(this.presentation.currentSlide);
    }
    
    function Presentation () {
        this.currentSlide = 1;
        this.totalSlides = 0;
    }
    
    function View () {
        this.slides = $('.slide');
        
        var self = this;
        
        var updatePositioning = function () {
            self.setSlideHeightFromWindow();
            self.verticallyCentreSlideContents();
        };
        
        $(window).bind("resize", function () {
            updatePositioning();
            self.resetSlidePosition();
        });
        
        this.setUpActions();
        
        this.wrapSlideContents();
        updatePositioning();
        
        this.hideNavElements();
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
    };
    
    /**
     * Updates the hash in the window's location
     */
    View.prototype.selectSlide = function (number) {
        window.location.hash = "slide" + number;
    };
    
    /**
     * Sets the height for each slide to that of the window (viewport)
     */
    View.prototype.setSlideHeightFromWindow = function () {
        this.slides.height($(window).height());
    };
    
    /**
     * Wraps contents of each slide in a div
     * Div is used as a shortcut to work out total contents height
     */
    View.prototype.wrapSlideContents = function () {
        this.slides.each(function (i) {
            var slide = $(this),
                children = slide.find('pre,blockquote,ol,ul,p:not(.navigation)');
                
            children.wrapAll('<div class="slideContents"></div>');
            children.css({
                'marginTop': 0,
                'marginBottom': '3%'
            });
            
            var contentsGroup = slide.find('.slideContents');
            contentsGroup.css({
                'float': 'left',
                'width': '100%'
            });
        });
    };
    
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
    };
    
    /**
     * Returns the number of slides found
     * @return Number
     */
    View.prototype.countSlides = function () {
        return $('.slide').length;
    };
    
    /**
     * Resets the slide postition.
     * Useful if the window is being resized.
     * Updates window.location.has with the current value
     */
    View.prototype.resetSlidePosition = function () {
        window.location.hash = window.location.hash;
    };
    
    View.prototype.showActions = function () {
        $('.actions').fadeIn();
    }
    
    View.prototype.hideActions = function () {
        $('.actions').fadeOut();
    }
    
    /**
     * Adds a listener to the body on mouseover.
     * Listener will show the actions links when the mouse moves
     * and hide it after a second.
     */
    View.prototype.setUpActions = function () {
            
        var actionsShown   = false,
            actionsTimeout = null,
            view            = this;
        
        var fadeOutActions = function () {
            view.hideActions();
            actionsTimeout = null;
            actionsShown = false;
        };
        
        view.hideActions();
        
        $('body').bind('mousemove', function (e) {
            
            if (actionsShown) {
                clearTimeout(actionsTimeout);
                actionsTimeout = setTimeout(fadeOutActions, 1000);
            }
            else {
                actionsShown = true;
                view.showActions();
                
                actionsTimeout = setTimeout(fadeOutActions, 1000);
            }
        });
    };
    
    View.prototype.hideNavElements = function () {
        $('.navigation').hide();
    }

    function CircleView () {
        $('.navigation').remove();

        function convertAngle (i) {
            return (Math.PI/180)*(i+(-180));
        }

        this.$slides = $('.slide');

        var totalSlides = this.$slides.length,
            slideWidth = $(window).width(),
            slideHeight = $(window).height(),
            radius = (totalSlides) * ((slideWidth/slideHeight)*10),
            radius = slideWidth,
            segmentAngle = 360 / totalSlides;

        // create origin
        var origin = {
            'x': slideWidth / 2,
            'y': slideHeight / 2
        }

        // TODO abstract as much of this as possible into sep CSS
        this.$slides.css({
            'width':    slideWidth,
            'height':   slideHeight
        });

        this.$slides.addClass('step');

        var $slideContainer = $('#slides');
        $slideContainer.attr('data-width', slideWidth);
        $slideContainer.attr('data-height', slideHeight);
        $slideContainer.attr('data-min-scale', '1');
        $slideContainer.attr('data-max-scale', '1');
        $slideContainer.attr('data-transition-duration', '350');

        function positionSlide (number) {
            var rotation = number * segmentAngle,
                angle    = convertAngle(rotation),
                x        = (radius*Math.cos(angle)) + origin.x,
                y        = (radius*Math.sin(angle)) + origin.y;

            var $el = $('#slide' + number);
            $el.attr('data-x', x);
            $el.attr('data-y', y);
            $el.attr('data-rotate', rotation);

            // measuring for contents re-positioning
            var $slideChildren = $el.children();
            $slideChildren.css('display', 'inline');
            var $slideMeasure = $el.wrapInner('<div class="slide-measure" style="display: inline; overflow: visible" />').find('.slide-measure');

            // font size
            var width = $slideMeasure.width(),
                height = $slideMeasure.height();

            $slideChildren.css('display', 'block');

            var contentRatioWidth = Math.floor(slideWidth / width),
                contentRatioHeight = Math.floor(slideHeight / height);

            var fontSize = ((contentRatioWidth > contentRatioHeight) ? contentRatioHeight : contentRatioWidth) / 1.5;
            $el.css('fontSize', fontSize + 'em');

            // vertical positioning
            $slideMeasure.css('display', 'block');
            var verticalPad = Math.floor((slideHeight - $slideMeasure.height()));
            $el.css('paddingTop', verticalPad + 'px');
        }

        for (var i = 1; i <= totalSlides; i++) {
            positionSlide(i);
        }

        impress('slides').init();       

    }
    
    function setup () {
        new Controller();
    }

    $(setup);
});