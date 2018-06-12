// Copyright 2016 Endless Mobile, Inc.

/* exported Deck */

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Card = imports.framework.interfaces.card;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;
const {View} = imports.framework.interfaces.view;

/**
 * Class: Deck
 * A card rendered as a bound-together deck of cards
 *
 * This card is useful for representing a set that can be explored further.
 *
 * CSS classes:
 *   - card - deprecated
 *   - content-frame - on the frame around the title and context
 *   - deck
 *   - title - on the document title
 *   - thumbnail - on the image thumbnail
 */
var Deck = new Module.Class({
    Name: 'Card.Deck',
    Extends: Gtk.Button,
    Implements: [View, Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/deck.ui',
    InternalChildren: ['overlay', 'shadow-frame', 'thumbnail-frame',
        'title-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    vfunc_draw: function (cr) {
        // FIXME: Would really be better to draw inside the frame directly
        // than try to suss out the position here. Really really, let's just
        // make this a border image in CSS
        let card_margins = this._get_widget_margins(this);
        let thumbnail_frame_margins = this._get_widget_margins(this._thumbnail_frame);
        let sleeve_alloc = this._shadow_frame.get_allocation();
        let sleeve_offset = this._shadow_frame.get_window().get_position()[1] -
            this._overlay.get_allocation().y;
        let shadow_top = sleeve_alloc.y + sleeve_alloc.height + sleeve_offset + card_margins.top;

        cr.save();
        Gdk.cairo_set_source_rgba(cr, new Gdk.RGBA({
            red: 0.6,
            green: 0.6,
            blue: 0.6,
            alpha: 1.0,
        }));
        cr.moveTo(card_margins.left, shadow_top);
        cr.lineTo(card_margins.left + thumbnail_frame_margins.left, shadow_top);
        cr.lineTo(card_margins.left + thumbnail_frame_margins.left, shadow_top + thumbnail_frame_margins.left);
        cr.fill();
        cr.moveTo(card_margins.left + sleeve_alloc.width, shadow_top);
        cr.lineTo(card_margins.left + sleeve_alloc.width - thumbnail_frame_margins.right, shadow_top);
        cr.lineTo(card_margins.left + sleeve_alloc.width - thumbnail_frame_margins.right,
            shadow_top + thumbnail_frame_margins.right);
        cr.fill();
        cr.restore();

        this.parent(cr);

        cr.$dispose();  // workaround not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },

    _get_widget_margins: function (widget) {
        let context = widget.get_style_context();
        let flags = widget.get_state_flags();

        context.save();
        context.set_state(flags);
        let margins = context.get_margin(context.get_state());
        context.restore();

        return margins;
    }
});
