// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const SMALL_HEIGHT = 80;
const MEDIUM_HEIGHT = 120;
const LARGE_HEIGHT = 160;
const X_LARGE_HEIGHT = 220;

const ThumbLayout = new Knowledge.Class({
    Name: 'Card.ThumbLayout',
    Extends: Endless.CustomContainer,

    _init: function (thumbnail, content, props={}) {
        this.parent(props);
        this.add(thumbnail);
        this.add(content);
        this._thumbnail = thumbnail;
        this._content = content;
        this.orientation = Gtk.Orientation.HORIZONTAL;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let [thumb_w, thumb_h, content_w, content_h] = this._get_dimensions(alloc);

        let thumb_alloc = new Gdk.Rectangle({
            x: alloc.x,
            y: alloc.y,
            width: thumb_w,
            height: thumb_h,
        });

        let content_alloc = new Gdk.Rectangle({
            x: alloc.x + (alloc.width - content_w),
            y: alloc.y + (alloc.height - content_h),
            width: content_w,
            height: content_h,
        });

        this._thumbnail.size_allocate(thumb_alloc);
        this._content.size_allocate(content_alloc);
    },

    _get_dimensions: function (alloc) {
        let thumb_width, thumb_height, text_width, text_height;
        let text_scale = Utils.get_text_scaling_factor();
        if (this.orientation == Gtk.Orientation.VERTICAL) {
            thumb_width = text_width = alloc.width;
            text_height = this._get_text_height(alloc) * text_scale;
            thumb_height = alloc.height - text_height;
        } else {
            thumb_height = text_height = alloc.height;
            thumb_width = text_width = (alloc.width / 2);
            // text_width = this._get_text_width(alloc) * text_scale;
            // thumb_width = alloc.width - text_width;
        }
        return [thumb_width, thumb_height, text_width, text_height];
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
            } else if (alloc.height <= Card.MaxSize.D) {
                return LARGE_HEIGHT;
            }
        }
        return X_LARGE_HEIGHT;
    },
});

/**
 * Class: Thumb
 *
 * A card displaying a thumbnail with an area underneath for title and tag
 * information.
 */
const Thumb = new Module.Class({
    Name: 'Card.Thumb',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/thumb.ui',
    InternalChildren: [ 'thumbnail-frame', 'inner-grid', 'content-frame', 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        this._context_widget = this.create_context_widget_from_model();
        this._inner_grid.add(this._context_widget);

        this.set_size_request(Card.MinSize.B, Card.MinSize.B);
        this._layout = new ThumbLayout(this._thumbnail_frame, this._content_frame, {
            visible: true,
        });
        this.add(this._layout);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        Utils.set_hand_cursor_on_widget(this);
    },

    vfunc_size_allocate: function (alloc) {
        let orientation = this._get_orientation(alloc.width, alloc.height);
        if (orientation === Gtk.Orientation.HORIZONTAL) {
            if (alloc.height <= Card.MinSize.C) {
                this._title_label.lines = 2;
            } else {
                this._title_label.lines = 3;
            }            
        } else {
            this._title_label.lines = 2;
        }

        this._context_widget.halign = Gtk.Align.START;
        this._context_widget.valign = Gtk.Align.END;

        if (this._should_show_synopsis(alloc.width, alloc.height, orientation)) {
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
            this._title_label.valign = Gtk.Align.END;
            this._synopsis_label.valign = Gtk.Align.START;
        } else {
            this._title_label.valign = Gtk.Align.CENTER;
            this._synopsis_label.hide();
        }

        if (this._should_hide_context(alloc.width, alloc.height)) {
            this._context_widget.hide();
        } else {
            this._context_widget.show_all();
        }

        this._layout.orientation = orientation;
        this.parent(alloc);
        /* 
            FIXME: This is a fix toget rid of extra size the widget thinks it's taking up
            because of margins between cards in the card CSS in certain arrangements.
        */
        let this_margin = this._get_margin();
        let real_alloc = {
                            height: (alloc.height - (this_margin.top + this_margin.bottom)),
                            width: (alloc.width - (this_margin.left + this_margin.right))
                        };
        this.update_card_sizing_classes(real_alloc.height, real_alloc.width);
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround bug for not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },

    _get_orientation: function (width, height) {
        let horizontal = (width > Card.MaxSize.C && height < Card.MinSize.C) ||
            (width > Card.MaxSize.D && height < Card.MinSize.E) ||
            (width > Card.MaxSize.E && height < Card.MinSize.E) ||
            (width > Card.MaxSize.F);
        return horizontal ? Gtk.Orientation.HORIZONTAL : Gtk.Orientation.VERTICAL;
    },

    _should_show_synopsis: function (width, height, orientation) {
        return height > Card.MaxSize.C && orientation == Gtk.Orientation.HORIZONTAL;
    },

    _should_hide_context: function (width, height) {
        return width <= Card.MaxSize.B || (width <= Card.MaxSize.C && height <= Card.MaxSize.B);
    },

    _get_margin: function () {
        let context = this._get_fresh_state_context();
        let margin = context.get_margin(context.get_state());
        context.restore();
        return margin;
    },

    _get_fresh_state_context: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);

        return context;
    },
});
