// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.card;


/**
 * Class: CardA
 *
 * A card subclass with sizing and styling specific to template A
 */
const CardA = new Lang.Class({
    Name: 'CardA',
    GTypeName: 'EknCardA',
    Extends: Card.Card,

    CARD_WIDTH: 183,
    CARD_HEIGHT: 209,
    CARD_MARGIN: 7,

    _init: function(props) {
        props = props || {};
        props.expand = false;
        props.halign = Gtk.Align.START;

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_A);
        // Our button size changes via css state selectors on hover, and for
        // some reason Gtk isn't handling this queue resize for us
        this.connect('state-flags-changed', function () {
            this.queue_resize();
        }.bind(this));
    },

    pack_widgets: function (title_label, synopsis_label, image_frame) {
        title_label.lines = 2;
        this.parent(title_label, synopsis_label, image_frame);
    },

    // TODO: we do want all cards to be the same size, but we may want to make
    // this size scale with resolution down the road
    vfunc_get_preferred_width: function () {
        return [this.CARD_WIDTH + 2 * this.CARD_MARGIN, this.CARD_WIDTH + 2 * this.CARD_MARGIN];
    },

    vfunc_get_preferred_height: function () {
        return [this.CARD_HEIGHT + 2 * this.CARD_MARGIN, this.CARD_HEIGHT + 2 * this.CARD_MARGIN];
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    }
});
