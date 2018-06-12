const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.framework.knowledge;

/**
 * Class: TabButton
 */
var TabButton = new Knowledge.Class({
    Name: 'TabButton',
    Extends: Gtk.Button,

    Properties: {
         /**
         * Property: position
         *
         * The position of the button on the page
         */
        'position': GObject.ParamSpec.enum('position', 'Position',
            'The position of this button on the page',
            GObject.ParamFlags.READWRITE,
            Gtk.PositionType, Gtk.PositionType.TOP),
    },

    _init: function (props) {
        props = props || {};
        props.always_show_image = true;
        props.image_position = Gtk.PositionType.RIGHT;
        props.halign = Gtk.Align.CENTER;
        this.parent(props);
    },

    set position (v) {
        if (v == Gtk.PositionType.TOP) {
            this.get_style_context().add_class(Gtk.STYLE_CLASS_TOP);
            this.image = new Gtk.Image({
                icon_name: 'go-up-symbolic'
            });
        } else {
            this.get_style_context().add_class(Gtk.STYLE_CLASS_BOTTOM);
            this.image = new Gtk.Image({
                icon_name: 'go-down-symbolic'
            });
        }
    },
});
