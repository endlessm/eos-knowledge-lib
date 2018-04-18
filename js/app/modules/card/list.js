// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const NavigationCard = imports.app.interfaces.navigationCard;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

/**
 * Class: List
 *
 * A long skinny card good for showing results in a vertical list format.
 */
var List = new Module.Class({
    Name: 'Card.List',
    Extends: Gtk.Button,
    Implements: [View, Card.Card, NavigationCard.NavigationCard],

    Properties: {
        /**
         * Property: show-synopsis
         * Whether to show the synopsis label.
         */
        'show-synopsis': GObject.ParamSpec.boolean('show-synopsis',
            'Show synopsis', 'Whether to show the synopsis label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
        /**
         * Property: show-context
         * Whether to show the context label.
         */
        'show-context': GObject.ParamSpec.boolean('show-context',
            'Show context', 'Whether to show the context label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/list.ui',
    InternalChildren: [ 'thumbnail-frame', 'inner-content-grid', 'title-label',
    'synopsis-label', 'navigation-context-label', 'checkmark', 'context-label',
    'context-box', 'thumbnail-overlay'],

    _init: function (props={}) {
        this.parent(props);

        if (this._title_label)
            this.set_title_label_with_highlight(this._title_label);
        if (this._synopsis_label)
            this.set_label_with_highlight(this._synopsis_label, this.model.synopsis);
        if (this.navigation_context)
            this.set_label_or_hide(this._navigation_context_label, this.navigation_context);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_media_overlay_from_model(this._thumbnail_overlay);

        // FIXME: It's not clear what should go in the context label if model
        // is not a video. This may need to be changed later on once we clarify
        // that with other presets.
        // Note: This will hide the duration label if duration is 0
        if (this.model.duration) {
            this.set_duration_label(this._context_label, this.model.duration);
        }

        if (this.show_context) {
            this._context_widget = this.create_context_widget_from_model();
            this._context_box.add(this._context_widget);
            this._context_box.show();
        }

        this.update_card_sizing_classes(Card.MinSize.A, Card.MinSize.D);
        this._synopsis_label.visible = this.show_synopsis;
        this._title_label.vexpand = !this.show_synopsis;
        this._sync_checkmark_state();
        ReadingHistoryModel.get_default().connect('changed', this._sync_checkmark_state.bind(this));
        Utils.set_hand_cursor_on_widget(this);
    },

    _sync_checkmark_state: function () {
        this._checkmark.visible = ReadingHistoryModel.get_default().is_read_article(this.model.id);
    },

    _IMAGE_WIDTH_RATIO: 1.5,

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.WIDTH_FOR_HEIGHT;
    },

    _get_margins: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);
        let card_margins = context.get_margin(context.get_state());
        context.restore();
        return card_margins;
    },

    vfunc_get_preferred_width_for_height: function (height) {
        let card_margins = this._get_margins();
        let image_height = height - (card_margins.top + card_margins.bottom);
        let image_width = image_height * this._IMAGE_WIDTH_RATIO;

        let [text_min, text_nat] = this._inner_content_grid.get_preferred_width();
        let [checkmark_min, checkmark_nat] = this._checkmark.get_preferred_width();
        return [text_min + image_width + checkmark_min, text_nat + image_width + checkmark_nat];
    },

    vfunc_size_allocate: function (alloc) {
        let card_margins = this._get_margins();

        let image_height = alloc.height - (card_margins.top + card_margins.bottom);
        let image_width = image_height * this._IMAGE_WIDTH_RATIO;
        let total_content_width = alloc.width - (card_margins.left + card_margins.right);
        let checkmark_width = this._checkmark.get_preferred_width()[1];
        let text_width = total_content_width -  image_width - checkmark_width;

        this.parent(alloc);

        let image_alloc = new Gdk.Rectangle({
            x: alloc.x + card_margins.left,
            y: alloc.y + card_margins.top,
            width: image_width,
            height: image_height,
        });
        this._thumbnail_frame.size_allocate(image_alloc);

        let text_alloc = new Gdk.Rectangle({
            x: alloc.x + image_width + card_margins.left,
            y: alloc.y + card_margins.top,
            width: text_width,
            height: image_height,
        });
        this._inner_content_grid.size_allocate(text_alloc);

        if (this._checkmark.visible) {
            let checkmark_alloc = new Gdk.Rectangle({
                x: alloc.x + image_width + card_margins.left + text_width,
                y: alloc.y + card_margins.top,
                width: checkmark_width,
                height: image_height,
            });
            this._checkmark.size_allocate(checkmark_alloc);
        }

        this.update_card_sizing_classes(alloc.height, alloc.width);
    },
});
