// Copyright 2016 Endless Mobile, Inc.

/* exported Deck */

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

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
const Deck = new Module.Class({
    Name: 'Card.Deck',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/deckCard.ui',
    InternalChildren: ['overlay', 'shadow-frame', 'thumbnail-frame',
        'title-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);

        this._thumbnail_frame.connect_after('draw', (widget, cr) => {
            Utils.render_border_with_arrow(this._thumbnail_frame, cr);
            cr.$dispose();  // workaround not freeing cairo context
            return Gdk.EVENT_PROPAGATE;
        });

        this._overlay.connect('get-child-position',
            this._overlay_get_child_position.bind(this));
    },

    _overlay_get_child_position: function (overlay, child, allocation) {
        let width = overlay.get_allocated_width();
        let height = overlay.get_allocated_height();
        allocation.x = 0;
        allocation.width = width;
        let [min_height,] = child.get_preferred_height_for_width(width);
        let sleeve_height = height > Card.MaxSize.B ? 120 : 80;
        sleeve_height = Math.max(sleeve_height, min_height);
        allocation.y = (height / 2) - (sleeve_height / 2);
        allocation.height = sleeve_height;
        return [true, allocation];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    vfunc_draw: function (cr) {
        // FIXME: Would really be better to draw inside the frame directly
        // than try to suss out the position here. Really really, let's just
        // make this a border image in CSS
        let context = this._thumbnail_frame.get_style_context();
        let flags = this._thumbnail_frame.get_state_flags();
        let margins = context.get_margin(flags);
        let sleeve_alloc = this._shadow_frame.get_allocation();
        let sleeve_offset = this._shadow_frame.get_window().get_position()[1] -
            this._overlay.get_allocation().y;
        let shadow_top = sleeve_alloc.y + sleeve_alloc.height + sleeve_offset;

        cr.save();
        Gdk.cairo_set_source_rgba(cr, new Gdk.RGBA({
            red: 0.6,
            green: 0.6,
            blue: 0.6,
            alpha: 1.0,
        }));
        cr.moveTo(0, shadow_top);
        cr.lineTo(margins.left, shadow_top);
        cr.lineTo(margins.left, shadow_top + margins.left);
        cr.fill();
        cr.moveTo(sleeve_alloc.width, shadow_top);
        cr.lineTo(sleeve_alloc.width - margins.right, shadow_top);
        cr.lineTo(sleeve_alloc.width - margins.right,
            shadow_top + margins.right);
        cr.fill();
        cr.restore();

        this.parent(cr);

        cr.$dispose();  // workaround not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },
});
