// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const NavigationCard = imports.app.interfaces.navigationCard;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: List
 *
 * A long skinny card good for showing results in a vertical list format.
 */
const List = new Module.Class({
    Name: 'Card.List',
    Extends: Gtk.Button,
    Implements: [Card.Card, NavigationCard.NavigationCard],

    Properties: {
        /**
         * Property: show-synopsis
         * Whether to show the synopsis label.
         */
        'show-synopsis': GObject.ParamSpec.boolean('show-synopsis',
            'Show synopsis', 'Whether to show the synopsis label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },


    StyleProperties: {
        /**
         * This property determines how we scale the thumbnail image. It uses a
         * similar vocabulary as web css' background-size property: 'cover' and
         * 'center'. 'cover' means we will reposition and rescale the image to
         * cover the entire thumbnail space. 'center' means we will maintain the
         * image's original dimensions and center it in the thumbnail space.
         */
        'thumbnail-background-size': GObject.ParamSpec.string('thumbnail-background-size',
            'Thumbnail background size', 'The background size of the thumbnail image',
            GObject.ParamFlags.READWRITE,
            'cover'),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/list.ui',
    InternalChildren: [ 'thumbnail-frame', 'content-frame', 'title-label', 'synopsis-label', 'navigation-context-label'],

    _init: function (props={}) {
        this.parent(props);

        if (this._title_label)
            this.set_title_label_with_highlight(this._title_label);
        if (this._synopsis_label)
            this.set_label_with_highlight(this._synopsis_label, this.model.synopsis);
        if (this.navigation_context)
            this.set_label_or_hide(this._navigation_context_label, this.navigation_context);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_size_request(Card.MinSize.D, Card.MinSize.A);
        this.update_card_sizing_classes(Card.MinSize.A, Card.MinSize.D);
        this._synopsis_label.visible = this.show_synopsis;

        Utils.set_hand_cursor_on_widget(this);
    },

    _TEXT_SIZE_RATIO: 0.64,
    _IMAGE_WIDTH_RATIO: 1.5,

    vfunc_size_allocate: function (alloc) {
        let text_width = alloc.width * this._TEXT_SIZE_RATIO;
        let image_width = alloc.height * this._IMAGE_WIDTH_RATIO;
        let total_width, margin;
        if (alloc.width > text_width + image_width) {
            total_width = text_width + image_width;
            margin = (alloc.width - total_width) / 2;
        } else {
            total_width = alloc.width;
            margin = 0;
        }

        let card_alloc = new Gdk.Rectangle({
            x: alloc.x + margin,
            y: alloc.y,
            width: total_width,
            height: alloc.height,
        });

        this.parent(card_alloc);

        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);
        let card_margins = context.get_margin(context.get_state());
        context.restore();

        let image_alloc = new Gdk.Rectangle({
            x: alloc.x + margin + card_margins.left,
            y: alloc.y + card_margins.top,
            width: image_width - (card_margins.left + card_margins.right),
            height: alloc.height - (card_margins.top + card_margins.bottom),
        });
        this._thumbnail_frame.size_allocate(image_alloc);

        let text_alloc = new Gdk.Rectangle({
            x: alloc.x + margin + image_width + card_margins.left,
            y: alloc.y + card_margins.top,
            width: text_width - (card_margins.left + card_margins.right),
            height: alloc.height - (card_margins.top + card_margins.bottom),
        });
        this._content_frame.size_allocate(text_alloc);

        this.update_card_sizing_classes(card_alloc.height, card_alloc.width);
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround bug for not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },
});
