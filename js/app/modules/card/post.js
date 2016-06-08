// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: Post
 * A card the resembles a postcard, the entire background being an image.
 *
 * CSS classes:
 *   - card - deprecated, should be replaced by CSS name
 *   - content-frame - on the frame around the title and context; used for
 *     shading behind the text so that you can see it above the background
 *   - post-card
 *   - title - on the document title
 *   - thumbnail - on the image thumbnail
 */
const Post = new Module.Class({
    Name: 'Card.Post',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/post.ui',
    InternalChildren: ['inner-content-grid', 'shadow-frame', 'thumbnail-frame',
        'title-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);

        this._context_widget = this.create_context_widget_from_model();
        this._inner_content_grid.add(this._context_widget);
        this._title_label.halign = this._context_widget.halign = this.text_halign;
        this._title_label.justify = Utils.alignment_to_justification(this.text_halign);
        this._title_label.xalign = Utils.alignment_to_xalign(this.text_halign);
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },
});
