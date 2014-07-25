/** scroll-manager.js
 *  The scroll manager does two things:
 *      1. Provide a scrollTo for animated scrolling to an anchor
 *         hash
 *      2. Provide URI notifications when an anchored tag has been
 *         scrolled past
 *
 *  To use the scrollTo function simply call scrollTo("#someHash", 1000)
 *  and the function will kick off an animated scroll to that location
 *  with the specified duration.
 *
 *  Notification for scrolling past an element happens in the form of
 *  window.location.hash changes. If a new element where id=elementId
 *  comes into view (where view is defined by isInView(element)), the 
 *  current hash will change to "#scrolled-past-{elementId}".
 *  Only elements matching SCROLL_NOTIFIER_MATCHER will be watched
 */

// The hash prefixes used to interface with the scroll manager
const SCROLLED_PAST_PREFIX = '#scrolled-past-';

// Defines the jQuery matcher expression for grabbing elements
// we want to watch for when user scrolls
const SCROLL_NOTIFIER_MATCHER = '.mw-headline';

// If the anchor at the specified hash exists, scroll to it.
// Returns whether the caller should propagate events
window.scrollTo = function (hash, duration) {
    var target = $(hash.replace(/\./g, '\\.'));
    if (target.length) {
        var body = $('html,body');
        var maxScroll = $(document).height() - $(window).height();
        body.stop();
        body.animate({
          scrollTop: Math.min(target.offset().top, maxScroll)
        }, duration);
        return false;
    }
    return true;
}

// Whenever a scroll event happens, filter the scrollNotifer
// elements for ones that are inView. If any elements are, 
// grab the first one and update the hash to say we've scrolled
// past it
$(window).bind('scroll', function () {
    var scrollPosition = $(window).scrollTop();
    var distance = 0;
    var scrolledPastNode = null;
    $(SCROLL_NOTIFIER_MATCHER).each(function (index, node) {
        var nodePosition = $(node).offset().top;
        var nodeDistance = Math.abs(scrollPosition - nodePosition);
        if (scrolledPastNode === null || nodeDistance < distance) {
            scrolledPastNode = node;
            distance = nodeDistance;
        }
    });
    if (scrolledPastNode !== null) {
        window.location.hash = SCROLLED_PAST_PREFIX + scrolledPastNode.id;
    }
});
