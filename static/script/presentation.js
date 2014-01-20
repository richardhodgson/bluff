define(["jquery", "./vendor/impress.js"], function ($) {
    
    function Controller () {
        this.view = new CircleView();
    }
    
    function CircleView () {

        this.setUpActions();
        
        $('.navigation').remove();
        $('#slides').addClass('shapes');

        this.$slides = $('.slide');

        var totalSlides = this.$slides.length,
            slideWidth = $(window).width(),
            slideHeight = $(window).height(),
            radius = slideWidth * 1.5,
            radius = slideWidth * 10,
            segmentAngle = 360 / totalSlides;

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


        function addCircle ($canvas, x, y, radius, fillStyle) {
            var context = $canvas[0].getContext('2d');
            context.fillStyle = fillStyle;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI*2, true); 
            context.closePath();
            context.fill();
        }

        var largeCircleMin = Math.floor(slideWidth / 6),
            largeCircleMax = Math.floor(slideWidth / 3);

        var largeCircleSize = 100 //Math.floor((slideWidth / (len/10))/2);

        if (largeCircleSize > largeCircleMax) {
            largeCircleSize = largeCircleMax;
        }
        else if (largeCircleSize < largeCircleMin) {
            largeCircleSize = largeCircleMin;
        }

        var canvasHeight = parseInt($(window).height()) + (largeCircleSize*2),
            canvasWidth = parseInt($(window).width()) + (largeCircleSize*2);

        var $canvas = $('<canvas id="shapes-bg" style="position:absolute; left: -'+ largeCircleSize +'px; top: -'+ largeCircleSize +'px;" height="'+ canvasHeight +'" width="'+ canvasWidth +'" />').prependTo('.page');

        addCircle($canvas, largeCircleSize, largeCircleSize, largeCircleSize, 'rgba(0, 0, 255, 0.1)');
        addCircle($canvas, (largeCircleSize*1.5), (largeCircleSize*2), (largeCircleSize * 0.2), 'rgba(255, 150, 0, 0.3)');
        addCircle($canvas, (largeCircleSize*2.5), (largeCircleSize*0.8), (largeCircleSize * 0.8), 'rgba(255, 150, 0, 0.1)');

        
        addCircle($canvas, (canvasWidth - (largeCircleSize*3)), (canvasHeight - largeCircleSize), (largeCircleSize * 0.6), 'rgba(255, 150, 0, 0.1)');
        addCircle($canvas, (canvasWidth - (largeCircleSize*3.5)), (canvasHeight - (largeCircleSize*1.5)), (largeCircleSize * 0.3), 'rgba(0, 0, 255, 0.1)');

        addCircle($canvas, (canvasWidth - (largeCircleSize*1.5)), (largeCircleSize*1.5), (largeCircleSize * 0.8), 'rgba(0, 0, 255, 0.1)');
        addCircle($canvas, (canvasWidth - (largeCircleSize*1.6)), (largeCircleSize*2.4), (largeCircleSize * 0.4), 'rgba(255, 150, 0, 0.1)');

        addCircle($canvas, (largeCircleSize*1.6), (canvasHeight - largeCircleSize*1.4), (largeCircleSize * 0.9), 'rgba(255, 150, 0, 0.1)');

        var self = this;
        // chrome 32.0.1700.77 calculates slide contents height incorrectly.
        setTimeout(
            function () {

                for (var i = 1; i <= totalSlides; i++) {
                    self.positionSlide(slideWidth, slideHeight, radius, segmentAngle, i);
                }

                impress('slides').init();
                self.triggerReady();

            },
            100
        );
    }

    CircleView.prototype.positionSlide = function (slideWidth, slideHeight, radius, segmentAngle, number) {

        var originX  = slideWidth / 2,
            originY  = slideHeight / 2,
            rotation = number * segmentAngle,
            angle    = this.rotationToAngle(rotation),
            x        = (radius*Math.cos(angle)) + originX,
            y        = (radius*Math.sin(angle)) + originY;

        var $el = $('#slide' + number);
        $el.attr('data-x', x);
        $el.attr('data-y', y);
        $el.attr('data-rotate', rotation);

        // Calculate the font-size for the slide contents.
        var $slideChildren = $el.children();

        var $slideMeasure = $el.wrapInner('<div class="slide-measure" style="display: block; overflow: visible; z-index: 10" />').find('.slide-measure');

        var width  = $slideMeasure.width(),
            height = $slideMeasure.height(),
            contentRatioWidth = Math.floor(slideWidth / width),
            contentRatioHeight = Math.floor(slideHeight / height);

        var fontSize = ((contentRatioWidth > contentRatioHeight) ? contentRatioHeight : contentRatioWidth) / 1.15,
            fontSize = Math.round((fontSize * 10)) / 10; // round to 1 decimal place

        $el.css('fontSize', fontSize + 'em');

        // vertical positioning
        $slideMeasure.css('display', 'block');
        var verticalPad = Math.floor((slideHeight - $slideMeasure.height()));
        $el.css('paddingTop', verticalPad + 'px');
    }

    CircleView.prototype.rotationToAngle = function (i) {
        return (Math.PI/180)*(i+(-180));
    }

    CircleView.prototype.showActions = function () {
        $('.actions').fadeIn();
    }
    
    CircleView.prototype.hideActions = function () {
        $('.actions').fadeOut();
    }
    
    /**
     * Adds a listener to the body on mouseover.
     * Listener will show the actions links when the mouse moves
     * and hide it after a second.
     */
    CircleView.prototype.setUpActions = function () {
            
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
    
    CircleView.prototype.hideNavElements = function () {
        $('.navigation').hide();
    }

    CircleView.prototype.triggerReady = function () {
        var page = $('.page');
        page.css('display', 'none');
        $('#reveal').remove();
        page.fadeIn(500);
    }
    
    function setup () {
        new Controller();
    }

    $(setup);
});