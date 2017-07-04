const Gtk = imports.gi.Gtk;

// To use:
// const CssClassMatcher = imports.tests.CssClassMatcher;
// in beforeEach():
// jasmine.addMatchers(CssClassMatcher.customMatchers)

function _descendantHasClass(widget, styleClass) {
    if (widget.get_style_context().has_class(styleClass))
        return true;
    if (widget instanceof Gtk.Container) {
        let children = [];
        // Retrieves internal children as well, widget.get_children() does not
        widget.forall(function (child) {
            children.push(child);
        });
        return children.some(function (child) {
            return _descendantHasClass(child, styleClass);
        });
    }
    return false;
}

var customMatchers = {
    // Usage:
    // expect(widget).toHaveCssClass(Gtk.STYLE_CLASS_LINKED);
    toHaveCssClass: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expected) {
                if (expected === undefined)
                    return { pass: false };

                let result = {
                    pass: widget.get_style_context().has_class(expected)
                };
                if (result.pass)
                    result.message = 'Expected ' + widget + ' not to have CSS class ' + expected + ', but it did';
                else
                    result.message = 'Expected ' + widget + ' to have CSS class ' + expected + ', but it did not';
                return result;
            }
        };
    },

    toHaveDescendantWithCssClass: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expected) {
                if (expected === undefined)
                    return { pass: false };

                let result = {
                    pass: _descendantHasClass(widget, expected)
                };
                if (result.pass)
                    result.message = 'Expected ' + widget + ' not to have a descendant with CSS class ' + expected + ', but it did';
                else
                    result.message = 'Expected ' + widget + ' to have a descendant with CSS class ' + expected + ', but it did not';
                return result;
            }
        };
    }
};
