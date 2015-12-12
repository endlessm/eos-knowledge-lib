// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Cairo = imports.gi.cairo;
const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

/**
 * Class: PostCard
 * A postcard for the new reader app.
 */
const PostCard = new Lang.Class({
    Name: 'PostCard',
    GTypeName: 'EknPostCard',
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

    Template: 'resource:///com/endlessm/knowledge/data/widgets/postCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'context-label',
        'inner-content-grid', 'shadow-frame' ],

    _init: function (props={}) {
        this.parent(props);

        this._showing_set = (this.model instanceof SetObjectModel.SetObjectModel);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.add_contextual_css_class();
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);

        if (this._showing_set) {
            this._inner_content_grid.valign = Gtk.Align.CENTER;
            this._thumbnail_frame.margin = 13;
            this._thumbnail_frame.connect_after('draw', (widget, cr) => {
                Utils.render_border_with_arrow(this._thumbnail_frame, cr);
                cr.$dispose();  // workaround not freeing cairo context
                return Gdk.EVENT_PROPAGATE;
            });
        } else {
            this.set_context_label_from_model(this._context_label);
        }
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        if (this._showing_set) {
            let sleeve_height = alloc.height > Card.MaxSize.B ? 120 : 80;
            let sleeve_alloc = new Cairo.RectangleInt({
                x: 0,
                y: (alloc.height / 2) - (sleeve_height / 2),
                width: alloc.width,
                height: sleeve_height,
            });
            this._shadow_frame.size_allocate(sleeve_alloc);

            // Ensure that margin grows with card size so that we
            // always see the deck svg in the background
            this._thumbnail_frame.margin = alloc.width / 20;
        } else {
            let content_height = this._get_content_height(alloc.height);
            let content_alloc = new Cairo.RectangleInt({
                x: 0,
                y: alloc.height - content_height,
                width: alloc.width,
                height: content_height,
            });
            this._shadow_frame.size_allocate(content_alloc);
        }
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    vfunc_draw: function (cr) {
        if (this._showing_set) {
            let margin = this._thumbnail_frame.margin;
            let sleeve_alloc = this._shadow_frame.get_allocation();
            let shadow_top = sleeve_alloc.y + sleeve_alloc.height;

            cr.save();
            Gdk.cairo_set_source_rgba(cr, new Gdk.RGBA({
                red: 0.6,
                green: 0.6,
                blue: 0.6,
                alpha: 1.0,
            }));
            cr.moveTo(0, shadow_top);
            cr.lineTo(margin, shadow_top);
            cr.lineTo(margin, shadow_top + margin);
            cr.fill();
            cr.moveTo(sleeve_alloc.width, shadow_top);
            cr.lineTo(sleeve_alloc.width - margin, shadow_top);
            cr.lineTo(sleeve_alloc.width - margin, shadow_top + margin);
            cr.fill();
            cr.restore();
        }

        this.parent(cr);

        if (!this._showing_set)
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
