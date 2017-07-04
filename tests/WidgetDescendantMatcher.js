const Gtk = imports.gi.Gtk;

// To use:
// const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
// in beforeEach():
// jasmine.addMatchers(WidgetDescendantMatcher.customMatchers)

// Returns true if cmp(descendant, match) returns true for any descendant of
// widget
function _match_descendant (widget, match, cmp) {
    if (cmp(widget, match))
        return true;
    if (widget instanceof Gtk.Container) {
        let children = [];
        // Retrieves internal children as well, widget.get_children() does not
        widget.forall(function (child) {
            children.push(child);
        });
        return children.some(function (child) {
            return _match_descendant(child, match, cmp);
        });
    }
    return false;
}

var customMatchers = {
    toHaveDescendant: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expected) {
                if (expected === undefined)
                    return { pass: false };

                let result = {
                    pass: _match_descendant(widget, expected, function (a, b) { return a === b; })
                };
                if (result.pass)
                    result.message = 'Expected ' + widget + ' not to have a descendant ' + expected + ', but it did';
                else
                    result.message = 'Expected ' + widget + ' to have a descendant ' + expected + ', but it did not';
                return result;
            }
        };
    },
    toHaveDescendantWithClass: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expectedClass) {
                if (expectedClass === undefined)
                    return { pass: false };

                let result = {
                    pass: _match_descendant(widget, expectedClass, function (a, b) { return a instanceof b; })
                };
                if (result.pass)
                    result.message = 'Expected ' + widget + ' not to have a descendant of class' + expectedClass + ', but it did';
                else
                    result.message = 'Expected ' + widget + ' to have a descendant of class' + expectedClass + ', but it did not';
                return result;
            }
        };
    },
};
