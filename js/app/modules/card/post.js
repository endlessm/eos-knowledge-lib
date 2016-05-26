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
    Name: 'PostCard',
    CssName: 'EknPostCard',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/postCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'inner-content-grid', 'shadow-frame', 'overlay' ],

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

        this._overlay.connect('get-child-position', this._overlay_get_child_position.bind(this));
    },

    _overlay_get_child_position: function (overlay, child, allocation) {
        let width = overlay.get_allocated_width();
        let height = overlay.get_allocated_height();
        allocation.x = 0;
        allocation.width = width;
        let [min_height,] = child.get_preferred_height_for_width(width);
        let content_height = this._get_content_height(height);
        content_height = Math.max(content_height, min_height);
        allocation.y = height - content_height;
        allocation.height = content_height;
        return [true, allocation];
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

    _get_content_height: function (height) {
        if (height <= Card.MaxSize.B) {
            return 90;
        } else if (height <= Card.MaxSize.C) {
            return 140;
        } else if (height <= Card.MaxSize.D) {
            return 190;
        } else {
            return 290;
        }
    }
});
