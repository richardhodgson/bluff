var litmus  = require('litmus');

exports.test = new litmus.Test('generator.js', function () {
    
    var generator = require('../lib/generator'),
        test      = this;
    
    this.plan(23);
    
    this.async('parse', function (handle) {
        
        test.ok(generator.parse, "Generator has parse method");
        
        var parse = generator.parse;
        
        test.ok(isArray(parse('')), "parsing no markdown returns an AST array");
        test.is(parse('').length, 1, "parsing no markdown returns empty AST object");
        
        
        // a simple presentation
        test.ok(isArray(parse('a slide')), "parse returns an AST array");
        test.is(parse('a slide')[1][0], 'div', "returned AST has a div");
        test.is(parse('a slide').length, 2, "returned AST has one div in total");
        test.ok(parse('a slide')[1][1].class, "returned AST has class attribute for div");
        test.is(parse('a slide')[1][1].class, 'slide', "returned AST div has 'slide' classname.");
        test.ok(parse('a slide')[1][1].id, "returned AST has id attribute for div");
        test.is(parse('a slide')[1][1].id, 'slide1', "returned AST div has correct id.");
        test.is(parse('a slide')[1][2][0], 'para', "returned AST has a paragraph in the first slide");
        test.is(parse('a slide')[1][2][1], 'a slide', "returned AST has correct content for paragraph");
        
        // presentation with multiple slides
        var multipleSlides = "a string\n\n---\n\n another slide\n\n---\n\na final slide";
        
        test.ok(isArray(parse(multipleSlides)), "parse for multiple slides returns an AST array");
        test.is(parse(multipleSlides).length, 4, "returned AST has 3 slides in total");
        test.is(parse(multipleSlides)[3][0], 'div', "returned AST has a third div");
        test.is(parse(multipleSlides)[3][1].class, 'slide', "last slide has 'slide' classname.");
        test.is(parse(multipleSlides)[3][1].id, 'slide3', "last div has correct id.");
        test.is(parse(multipleSlides)[3][2][1], 'a final slide', "returned AST has correct content for last paragraph");
        
        handle.finish();
    });
    
    this.async('render', function (handle) {
        
        test.ok(generator.render, "Generator has render method");
        
        var render = generator.render;
        
        test.is(typeof render('a slide'), 'string', 'render returns a string');
        
        test.is(
            render('a slide'),
            '<div class="slide" id="slide1"><p>a slide</p><p class="navigation"></p></div>',
            'render generates expected markup'
        );
        
        test.is(
            render("a slide\n\n---\n\nanother slide"),
                '<div class="slide" id="slide1"><p>a slide</p><p class="navigation"><a class="nextSlide" href="#slide2">next</a></p></div>' + "\n\n"+
                '<div class="slide" id="slide2"><p>another slide</p><p class="navigation"><a class="previousSlide" href="#slide1">previous</a></p></div>',
            'render 2 slides generates expected markup'
        );
        
        test.is(
            render("a slide\n\n---\n\nanother slide\n\n---\n\na final slide"),
                '<div class="slide" id="slide1"><p>a slide</p><p class="navigation"><a class="nextSlide" href="#slide2">next</a></p></div>' + "\n\n" +
                '<div class="slide" id="slide2"><p>another slide</p><p class="navigation"><a class="nextSlide" href="#slide3">next</a><a class="previousSlide" href="#slide1">previous</a></p></div>' + "\n\n" +
                '<div class="slide" id="slide3"><p>a final slide</p><p class="navigation"><a class="previousSlide" href="#slide2">previous</a></p></div>',
            'render 3 slides generates expected markup'
        );
        
        handle.finish();
    });
});


/**
 * @return bool
 */
function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}
