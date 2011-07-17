var md = require('markdown').markdown

exports.render = render;
exports.parse  = parse;

/**
 * Converts markdown to presentation HTML 
 * @param string markdown
 * @return string
 * @example
 * 
 * render("a slide === another slide")
 * 
 * Will return something like...
 * 
 * <div class="slide"><p>a slide</p></div><div class="slide"><p>another slide</p></div>
 */
function render (markdown) {
    
    var ast = parse(markdown),
        ast = addNavigationToSlides(ast);
    
    return md.renderJsonML(md.toHTMLTree(ast));
}

/**
 * Parse a markdown string for horizontal rules and convert to a
 * new div.
 * @param string markdown
 * @return An AST of the parsed markdown
 */
function parse (markdown) {
    // clean up odd line endings
    markdown = markdown.replace(/[\r]/g, "");
    ast      = md.parse(markdown);
    
    // markdown found nothing to parse
    if (ast.length == 1) {
        return ast;
    }
    
    // necessary? see below where its re-added
    if (ast[0] == 'markdown') {
        ast = ast.splice(1, ast.length);
    }
    
    // add a starting slide if needed
    if (ast[0][0] != 'hr') {
        ast.unshift(['hr'])
    }
    
    var slideAst = [],
        currentSlide = -1;
        
    for (var i = 0, l = ast.length; i < l; i++) {
        
        switch (ast[i][0]) {
            
            case 'hr':
                currentSlide++;
                
                // a <hr> denotes a new slide, so create a new div in the tree
                slideAst.push(
                    [
                        'div',
                        {class: "slide", id: "slide" + (currentSlide + 1)}
                    ]
                );
                break;
            case 'para':
                slideAst[currentSlide].push(ast[i]);
                break;
            default:
        }
    }
    
    slideAst.unshift(['markdown']);
    
    return slideAst;
}

/**
 * Add navigation links to the end of each slide.
 * 
 * Even if there is no navigation, will always add a
 * navigation para for consistency.
 */
function addNavigationToSlides (ast) {
    
    ast = ast.splice(1, ast.length);
    
    for (var i = 0, l = ast.length; i < l; i++) {
        
        var navigation = [
            'para',
            {class: "navigation"},
        ];
        
        // add the next slide link
        if ((i + 1) != l) {
            navigation.push(                
                [
                    'link',
                    {class: "nextSlide", href: "#slide" + (i+2)},
                    'next'
                ]
            );
        }
        
        // add the previous slide link
        if (l > 1 && i != 0) {
            navigation.push(                
                [
                    'link',
                    {class: "previousSlide", href: "#slide" + (i)},
                    'previous'
                ]
            );
        }
        
        ast[i].push(navigation);
    }
    
    ast.unshift(['markdown']);
    
    return ast;
}