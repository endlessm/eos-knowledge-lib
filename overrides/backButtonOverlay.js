// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.utils;

/**
 * Class: BackButtonOverlay
 *
 * An overlay with a back button in the middle of the left hand side, used in
 * section and article pages
 */
const BackButtonOverlay = new Lang.Class({
    Name: 'BackButtonOverlay',
    GTypeName: 'EknBackButtonOverlay',
    Extends: Gtk.Overlay,
    Signals: {
        /**
         * Event: back-clicked
         * This event is triggered when the Back button is clicked.
         */
        'back-clicked': {}
    },

    _ARROW_SIZE: 20,

    _init: function (props) {
        this.parent(props);

        /*
         * Back button
         */
        let image = new Gtk.Image({
            icon_name: 'go-previous-symbolic',
            pixel_size: this._ARROW_SIZE
        });
        this._back_button = new Gtk.Button({
            image: image,
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER
        });
        this._back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        this._back_button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_BACK_BUTTON);
        this._back_button.show_all();
        // Our button size changes via css state selectors on hover, and for
        // some reason Gtk isn't handling this queue resize for us
        this._back_button.connect('state-flags-changed', function () {
            this._back_button.queue_resize();
        }.bind(this));

        Utils.set_hand_cursor_on_widget(this._back_button);

        this.add_overlay(this._back_button);
    }
});
