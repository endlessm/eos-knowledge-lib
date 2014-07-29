const Gtk = imports.gi.Gtk;

// To use:
// const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;
// in beforeEach():
// jasmine.addMatchers(WidgetDescendantMatcher.customMatchers)

function _has_descendant(widget, descendant) {
    if (widget === descendant)
        return true;
    if (widget instanceof Gtk.Container) {
        let children = [];
        // Retrieves internal children as well, widget.get_children() does not
        widget.forall(function (child) {
            children.push(child);
        });
        return children.some(function (child) {
            return _has_descendant(child, descendant);
        });
    }
    return false;
}

const customMatchers = {
    toHaveDescendant: function (util, customEqualityTesters) {
        return {
            compare: function (widget, expected) {
                if (expected === undefined)
                    return { pass: false };

                let result = {
                    pass: _has_descendant(widget, expected)
                };
                if (result.pass)
                    result.message = 'Expected ' + widget + ' not to have a descendant' + expected + ', but it did';
                else
                    result.message = 'Expected ' + widget + ' to have a descendant ' + expected + ', but it did not';
                return result;
            }
        };
    }
};
