const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const TabButton = new Lang.Class({
    Name: 'TabButton',
    GTypeName: 'EknTabButton',
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
        /**
         * Property: css
         * A string of css to be applied to this widget. Defaults to an empty string.
         */
        'css': GObject.ParamSpec.string('css', 'CSS rules',
            'CSS rules to be applied to this widget',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
    },

    _init: function (props) {
        props = props || {};
        props.always_show_image = true;
        props.image_position = Gtk.PositionType.RIGHT;
        props.halign = Gtk.Align.CENTER;
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.TAB_BUTTON);
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

    set css (v) {
        if (this._css === v)
            return;
        this._css = v;
        if (this._css) {
            Utils.apply_css_to_widget(this._css, this);
        }
        this.notify('css');
    },

    get css () {
        if (this._css)
            return this._css;
        return '';
    },
});
