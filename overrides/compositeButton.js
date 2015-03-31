/* global private_imports */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const MarginButton = private_imports.marginButton;

// Class for buttons whose :hover and :active CSS pseudoclass states should be
// inherited by some of their child widgets, since as of GTK 3.10 these flags no
// longer propagate from a widget to its children. Widgets in sensitiveChildren
// will listen to this widget's state-flags-changed event and inherit all flag
// values listed in _INHERITED_FLAGS.

const CompositeButton = new Lang.Class({
    Name: 'CompositeButton',
    GTypeName: 'EknCompositeButton',
    Extends: MarginButton.MarginButton,

    _INHERITED_FLAGS: [Gtk.StateFlags.PRELIGHT, Gtk.StateFlags.ACTIVE],

    _init: function (props) {
        this._handlerSet = false;
        this._sensitiveChildren = [];
        this.parent(props);
    },

    // Set the list of child widgets which will inherit the CompositeButton's
    // hover/active state flags.
    setSensitiveChildren: function (children) {
        this._sensitiveChildren = children;
        // If the handlers for mouse events aren't already set, connect them
        if (!this._handlerSet) {
            this._connectStateChangedHandler();
        }
    },

    _connectStateChangedHandler: function () {
        this.connect('state-flags-changed',
            Lang.bind(this, this._stateChangedHandler));
        this._handlerSet = true;
    },

    _stateChangedHandler: function (widget, flags) {
        let myFlags = this.get_state_flags();
        this._sensitiveChildren.forEach(function (child) {
            this._INHERITED_FLAGS.forEach(function (flag) {
                // for each flag we want the children to inherit, grab this
                // widget's flag value, and set the child's matching flag
                // accordingly
                let myFlag = myFlags & flag;
                if (myFlag !== 0) {
                    child.set_state_flags(flag, false);
                } else {
                    child.unset_state_flags(flag);
                }
            });
        }, this);
    }
});
