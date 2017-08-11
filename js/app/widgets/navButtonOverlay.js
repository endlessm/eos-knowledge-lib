// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const ThemeableImage = imports.app.widgets.themeableImage;
const ToggleTweener = imports.app.toggleTweener;
const Utils = imports.app.utils;

/**
 * Class: GrowButton
 *
 * A button which grows to reveal more of itself on hover. Previously done as a
 * padding animation, in css, but resizing the button every frame was too slow.
 */
const GrowButton = new Knowledge.Class({
    Name: 'GrowButton',
    Extends: Gtk.Button,

    StyleProperties: {
        'grow-pixels': GObject.ParamSpec.int('grow-pixels', 'Grow Pixels',
            'Grow Pixels', GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 0),
    },

    _init: function (props={}) {
        this.parent(props);

        this._tweener = new ToggleTweener.ToggleTweener(this, {
            transition_duration: 500,
            active_value: 0,
        });
        this.connect('state-flags-changed', () => {
            this._tweener.set_active((this.get_state_flags() & Gtk.StateFlags.PRELIGHT) !== 0);
        });

        this.connect('style-set', this._update_custom_style.bind(this));
        this.connect('style-updated', this._update_custom_style.bind(this));
        this._update_custom_style();
    },

    _update_custom_style: function () {
        let grow_pixels = EosKnowledgePrivate.style_context_get_custom_int(this.get_style_context(),
                                                                           'grow-pixels');
        this._tweener.inactive_value = this.halign === Gtk.Align.START ? -grow_pixels : grow_pixels;
    },

    vfunc_draw: function (cr) {
        cr.translate(Math.round(this._tweener.get_value()), 0);
        this.parent(cr);
        cr.$dispose();
        return Gdk.EVENT_PROPAGATE;
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
var NavButtonOverlay = new Knowledge.Class({
    Name: 'NavButtonOverlay',
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
        this._back_button = new GrowButton({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });
        this._back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        let back_class = Utils.get_element_style_class(NavButtonOverlay, 'backButton');
        this._back_button.get_style_context().add_class(back_class);

        /*
         * Forward button
         */
        this._forward_button = new GrowButton({
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });
        this._forward_button.connect('clicked', function () {
            this.emit('forward-clicked');
        }.bind(this));
        let forward_class = Utils.get_element_style_class(NavButtonOverlay, 'forwardButton');
        this._forward_button.get_style_context().add_class(forward_class);

        this.parent(props);

        this._back_button.image = new ThemeableImage.ThemeableImage();
        let back_image_class = Utils.get_element_style_class(NavButtonOverlay, 'backButtonImage');
        this._back_button.image.get_style_context().add_class(back_image_class);
        this._forward_button.image = new ThemeableImage.ThemeableImage();
        let forward_image_class = Utils.get_element_style_class(NavButtonOverlay, 'forwardButtonImage');
        this._forward_button.image.get_style_context().add_class(forward_image_class);

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
});
