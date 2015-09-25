// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

const _SCROLLBAR_MARGIN_PX = 13;  // FIXME should be dynamic

const ArrowImage = new Lang.Class({
    Name: 'ArrowImage',
    GTypeName: 'EknArrowImage',
    Extends: Gtk.Image,

    _init: function (props={}) {
        this.parent(props);
        this.get_style_context().add_class(Gtk.STYLE_CLASS_ARROW);
    },

    vfunc_draw: function (cr) {
        Gtk.render_activity(this.get_style_context(), cr, 0, 0, this.get_allocated_width(), this.get_allocated_height());
        cr.$dispose();
    },
});

/**
 * Class: NavButtonOverlay
 *
 * An overlay with a back and forwards buttons on either side of the widget.
 * Either of buttons can be turned invisible using <back-visible> or
 * <forward-visible>.
 *
 * Emits <back-clicked> and <forward-clicked> signals when the corresponding
 * button is clicked.
 */
const NavButtonOverlay = new Lang.Class({
    Name: 'NavButtonOverlay',
    GTypeName: 'EknNavButtonOverlay',
    Extends: Gtk.Overlay,
    Properties: {
        /**
         * Property: back-visible
         * Whether the back button should be displayed
         */
        'back-visible': GObject.ParamSpec.boolean('back-visible',
            'Is Back Visible',
            'Boolean property to manage whether the back button should be shown. Defaults to true',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, true),

        /**
         * Property: forward-visible
         * Whether the forward button should be displayed
         */
        'forward-visible': GObject.ParamSpec.boolean('forward-visible',
            'Is Forward Visible',
            'Boolean property to manage whether the Forward button should be shown. Defaults to true',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, true),
        /**
         * Property: 'icon-size'
         * The size of the icons to be used in the navigation buttons.
         * FIXME: we should move this to the css theme ideally.
         */
        'icon-size': GObject.ParamSpec.uint('icon-size', 'Icon Size',
            'Size of the custom icons for the navigation buttons',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 22),
        /**
         * Property: accommodate-scrollbar
         * Whether to move the rightmost button to accommodate a scrollbar.
         *
         * If this property is set to true, then the right-side button gets an
         * extra margin equal to the width of a scrollbar.
         */
        'accommodate-scrollbar': GObject.ParamSpec.boolean('accommodate-scrollbar',
            'Accommodate scrollbar',
            'Whether to give the forward button an extra margin',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },

    Signals: {
        /**
         * Event: back-clicked
         * This event is triggered when the Back button is clicked.
         */
        'back-clicked': {},

        /**
         * Event: forward-clicked
         * This event is triggered when the Forward button is clicked.
         */
        'forward-clicked': {},
    },

    _init: function (props) {
        /*
         * Back button
         */
        this._back_button = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });
        this._back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        this._back_button.get_style_context().add_class(StyleClasses.NAV_BACK_BUTTON);
        this._back_button.show_all();

        /*
         * Forward button
         */
        this._forward_button = new Gtk.Button({
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
            margin_end: this._accommodate_scrollbar ? _SCROLLBAR_MARGIN_PX : 0,
        });
        this._forward_button.connect('clicked', function () {
            this.emit('forward-clicked');
        }.bind(this));
        this._forward_button.get_style_context().add_class(StyleClasses.NAV_FORWARD_BUTTON);
        this._forward_button.show_all();

        this.parent(props);

        this._back_button.image = new ArrowImage({
            pixel_size: this.icon_size,
        });
        this._forward_button.image = new ArrowImage({
            pixel_size: this.icon_size,
        });

        Utils.set_hand_cursor_on_widget(this._back_button);
        Utils.set_hand_cursor_on_widget(this._forward_button);

        this.add_overlay(this._back_button);
        this.add_overlay(this._forward_button);
    },

    set back_visible (v) {
        if (this._back_button.visible === v)
            return;
        this._back_button.visible = v;
        this.notify('back-visible');
    },

    get back_visible () {
        return this._back_button.visible;
    },

    set forward_visible (v) {
        if (this._forward_button.visible === v)
            return;
        this._forward_button.visible = v;
        this.notify('forward-visible');
    },

    get forward_visible () {
        return this._forward_button.visible;
    },

    set accommodate_scrollbar(value) {
        this._accommodate_scrollbar = value;
        this._forward_button.margin_end = value ? _SCROLLBAR_MARGIN_PX : 0;
        this.notify('accommodate-scrollbar');
    },

    get accommodate_scrollbar() {
        return this._accommodate_scrollbar;
    },
});
