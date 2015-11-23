// Copyright 2015 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

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
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/thumbCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'grid', 'inner-grid', 'content-frame', 'title-label', 'synopsis-label', 'context-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        this.set_context_label_from_model(this._context_label);
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);
    },

    _get_dimensions: function (alloc, orientation, proportion) {
        let thumb_width, thumb_height, text_width, text_height;
        if (orientation == Gtk.Orientation.VERTICAL) {
            thumb_width = text_width = alloc.width;
            thumb_height = alloc.height * proportion;
            text_height = alloc.height - thumb_height;
        } else {
            thumb_width = alloc.width * proportion;
            text_width = alloc.width - thumb_width;
            thumb_height = text_height = alloc.height;
        }
        return [thumb_width, thumb_height, text_width, text_height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        let orientation, proportion;

        // The orientation and the proportion variables
        // uniquely determine how the widgets on this card
        // will lay themselves out. The proportion refers to
        // the proportion of space to be taken up by the
        // thumbnail image
        if (this._should_go_horizontal(alloc.width, alloc.height)) {
            this._title_label.justify = Gtk.Justification.LEFT;
            this._title_label.halign = this._synopsis_label.halign = this._context_label.halign = Gtk.Align.START;
            orientation = Gtk.Orientation.HORIZONTAL;
            this._title_label.xalign = this._context_label.xalign = 0;
            proportion = 1/2;
        } else {
            this._title_label.justify = Gtk.Justification.CENTER;
            this._title_label.halign = this._synopsis_label.halign = this._context_label.halign = Gtk.Align.CENTER;
            orientation = Gtk.Orientation.VERTICAL;
            this._title_label.xalign = this._context_label.xalign = 0.5;
            proportion = 2/3;
        }

        let [thumb_w, thumb_h, text_w, text_h] = this._get_dimensions(alloc, orientation, proportion);

        let thumb_alloc = new Cairo.RectangleInt({
            x: alloc.x,
            y: alloc.y,
            width: thumb_w,
            height: thumb_h,
        });

        let text_alloc = new Cairo.RectangleInt({
            x: alloc.x + (alloc.width - text_w),
            y: alloc.y + (alloc.height - text_h),
            width: text_w,
            height: text_h,
        });

        if (this._should_show_synopsis(alloc.width, alloc.height))
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        else
            this._synopsis_label.hide();

        this._thumbnail_frame.size_allocate(thumb_alloc);
        this._content_frame.size_allocate(text_alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
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
});
