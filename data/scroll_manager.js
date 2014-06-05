/** scroll-manager.js
 *  The scroll manager aims to do two things:
 *      1. Provide animated scrolling to anchored tags in the DOM
 *      2. Provide URI notifications when an anchored tag has been
 *         scrolled past
 *
 *  Since WebKit is pretty assertive about its instant jump-navigation
 *  for when a hash matches an anchored tag, we instead provide animated
 *  animations when window.location.hash matches "#scroll-to-{elementId}"
 *  where elementId is the anchor you want to scroll to
 *
 *  Notification for scrolling past an element happens in the form of
 *  window.location.hash changes. If a new element where id=elementId
 *  comes into view (where view is defined by isInView(element)), the 
 *  current hash will change to "#scrolled-past-{elementId}".
 *  Only elements in scrollNotifiers will be watched for this
 */

;(function (window, document) {
// The hash prefixes used to interface with the scroll manager
const SCROLL_TO_PREFIX = '#scroll-to-';
const SCROLLED_PAST_PREFIX = '#scrolled-past-';

// Defines the jQuery matcher expression for grabbing elements
// we want to watch for when user scrolls
const SCROLL_NOTIFIER_MATCHER = '.mw-headline';

// eat your heart out, jquery
var $ = function(selector) {
    if (selector.indexOf('#') === 0) {
        return document.getElementById(selector.slice(1));
    } else if (selector.indexOf('.') === 0) {
        var elements = document.getElementsByClassName(selector.slice(1));
        return Array.prototype.slice.call(elements);
    } else {
        var elements = document.getElementsByTagName(selector);
        return Array.prototype.slice.call(elements);
    }
}

// This is the list of DOM elements which we'll
// keep track of when scrolling.
var scrollNotifiers = $(SCROLL_NOTIFIER_MATCHER);

// Function used to filter scrollNotifiers on each scroll event,
// returns true if the element should be considered in "view"
function isInView(node) {
    var nodePosition = node.documentOffsetTop;
    var viewportHeight = window.innerHeight;
    var scrollPosition = window.pageYOffset;
    var top_margin = 10; // allow a few pixels above the top of the window

    // in this case, "in view" means within the top quarter of the
    // viewport
    return nodePosition > scrollPosition - top_margin && nodePosition < scrollPosition + viewportHeight / 4;
}

// If the anchor at the specified hash exists and smooth scrolling is
// initialized, scroll to it
// Returns whether the caller should propagate events
function scrollTo(hash) {
    if ($(hash) !== null && window.smoothScroll !== null) {
        window.smoothScroll.animateScroll(null, hash);
        return false;
    }
    else return true;
}

// just in case a link on this page wants to navigate to an anchor,
// smoothly scroll there instead of jumping
$('a').map(function (element) {
    element.addEventListener('click', function () {
        var hash = '#' + element.href.split('#')[1];
        return scrollTo(hash);
    });
});

// If the window's hash value changes, see if it's a "scroll-to"
// hash. If so, strip it of the prefix and smoothly scroll to the
// hash. Otherwise, handle it normally
window.addEventListener('hashchange', function (e) {
    var hash = window.location.hash;
    if (hash.indexOf(SCROLL_TO_PREFIX) === 0) {
        var destinationHash = '#' + hash.split(SCROLL_TO_PREFIX)[1];
        return scrollTo(destinationHash);
    } else {
        return true;
    }
});

// Whenever a scroll event happens, filter the scrollNotifer
// elements for ones that are inView. If any elements are, 
// grab the first one and update the hash to say we've scrolled
// past it
window.addEventListener('scroll', function () {
    var elementsInView = scrollNotifiers.filter(function (element) {
       return isInView(element);
    });
    if (elementsInView.length !== 0) {
        var scrolledPastNode = elementsInView[0];
        window.location.hash = SCROLLED_PAST_PREFIX + scrolledPastNode.id;
    }
});

window.Object.defineProperty(Element.prototype, 'documentOffsetTop', {
    get: function () { 
        return this.offsetTop + (this.offsetParent ? this.offsetParent.documentOffsetTop : 0);
    }
});
})(window, window.document);
