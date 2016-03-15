// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const SMALL_HEIGHT = 80;
const MEDIUM_HEIGHT = 120;
const LARGE_HEIGHT = 140;
const X_LARGE_HEIGHT = 220;

const SMALL_WIDTH = 190;
const MEDIUM_WIDTH = 290;
const LARGE_WIDTH = 390;

/**
 * Class: ThumbCard
 *
 * A thumbnail card for the new reader app
 */
const ThumbCard = new Lang.Class({
    Name: 'ThumbCard',
    GTypeName: 'EknThumbCard',
    Extends: MarginButton.MarginButton,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
        'sequence': GObject.ParamSpec.override('sequence', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/thumbCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'grid', 'inner-grid', 'content-frame', 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        this.set_context_label_from_model(this._inner_grid);

        this.set_size_request(Card.MinSize.B, Card.MinSize.B);

        Utils.set_hand_cursor_on_widget(this);
    },

    _get_dimensions: function (alloc, orientation) {
        let thumb_width, thumb_height, text_width, text_height;
        if (orientation == Gtk.Orientation.VERTICAL) {
            thumb_width = text_width = alloc.width;
            text_height = this._get_text_height(alloc);
            thumb_height = alloc.height - text_height;
        } else {
            thumb_height = text_height = alloc.height;
            text_width = this._get_text_width(alloc);
            thumb_width = alloc.width - text_width;
        }
        return [thumb_width, thumb_height, text_width, text_height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        let orientation;

        // The orientation determines how the widgets on this card will lay
        // themselves out.
        if (this._should_go_horizontal(alloc.width, alloc.height)) {
            this.text_halign = Gtk.Align.START;
            orientation = Gtk.Orientation.HORIZONTAL;
        } else {
            orientation = Gtk.Orientation.VERTICAL;
        }
        this._title_label.halign = this._synopsis_label.halign = this._space_container.halign = this.text_halign;
        this._title_label.justify = Utils.alignment_to_justification(this.text_halign);
        this._title_label.xalign = Utils.alignment_to_xalign(this.text_halign);

        let [thumb_w, thumb_h, text_w, text_h] = this._get_dimensions(alloc, orientation);

        let thumb_alloc = new Gdk.Rectangle({
            x: alloc.x,
            y: alloc.y,
            width: thumb_w,
            height: thumb_h,
        });

        let text_alloc = new Gdk.Rectangle({
            x: alloc.x + (alloc.width - text_w),
            y: alloc.y + (alloc.height - text_h),
            width: text_w,
            height: text_h,
        });

        if (this._should_show_synopsis(alloc.width, alloc.height)) {
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
            this._title_label.valign = Gtk.Align.END;
        } else {
            this._title_label.valign = Gtk.Align.CENTER;
            this._synopsis_label.hide();
        }

        if (this._should_hide_context(alloc.width, alloc.height)) {
            this._space_container.hide();
        } else {
            this._space_container.show_all();
        }

        this._thumbnail_frame.size_allocate(thumb_alloc);
        this._content_frame.size_allocate(text_alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    _get_text_height: function (alloc) {
        if (alloc.width <= Card.MaxSize.B) {
            return SMALL_HEIGHT;
        } else if (alloc.width <= Card.MaxSize.C) {
            if (alloc.height <= Card.MaxSize.B) {
                return SMALL_HEIGHT;
            }
            return MEDIUM_HEIGHT;
        } else if (alloc.width <= Card.MaxSize.D) {
            if (alloc.height <= Card.MaxSize.C) {
                return MEDIUM_HEIGHT;
            }
            return LARGE_HEIGHT;
        }
        return X_LARGE_HEIGHT;
    },

    _get_text_width: function (alloc) {
        if (alloc.width <= Card.MaxSize.D) {
            return SMALL_WIDTH;
        } else if (alloc.width <= Card.MaxSize.E) {
            return MEDIUM_WIDTH;
        }
        return LARGE_WIDTH;
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround bug for not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },

    _should_go_horizontal: function (width, height) {
        return (width > Card.MaxSize.C && height < Card.MinSize.C) ||
            (width > Card.MaxSize.D && height < Card.MinSize.D) ||
            (width > Card.MaxSize.E && height < Card.MinSize.E) ||
            (width > Card.MaxSize.F);
    },

    _should_show_synopsis: function (width, height) {
        return height > Card.MaxSize.C && this._should_go_horizontal(width, height);
    },

    _should_hide_context: function (width, height) {
        return width <= Card.MaxSize.B || (width <= Card.MaxSize.C && height <= Card.MaxSize.B);
    },
});
