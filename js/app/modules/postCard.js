// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
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
    CssName: 'EknPostCard',
    Extends: Gtk.Button,
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

    Template: 'resource:///com/endlessm/knowledge/data/widgets/postCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'inner-content-grid', 'shadow-frame', 'overlay' ],

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
            this._context_widget = this.create_context_widget_from_model();
            this._inner_content_grid.add(this._context_widget);
            this._title_label.halign = this._context_widget.halign = this.text_halign;
            this._title_label.justify = Utils.alignment_to_justification(this.text_halign);
            this._title_label.xalign = Utils.alignment_to_xalign(this.text_halign);
        }

        this._overlay.connect('get-child-position', this._overlay_get_child_position.bind(this));
    },

    _overlay_get_child_position: function (overlay, child, allocation) {
        let width = overlay.get_allocated_width();
        let height = overlay.get_allocated_height();
        allocation.x = 0;
        allocation.width = width;
        let [min_height,] = child.get_preferred_height_for_width(width);
        if (this._showing_set) {
            let sleeve_height = height > Card.MaxSize.B ? 120 : 80;
            sleeve_height = Math.max(sleeve_height, min_height);
            allocation.y = (height / 2) - (sleeve_height / 2);
            allocation.height = sleeve_height;
        } else {
            let content_height = this._get_content_height(height);
            content_height = Math.max(content_height, min_height);
            allocation.y = height - content_height;
            allocation.height = content_height;
        }
        return [true, allocation];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    vfunc_draw: function (cr) {
        if (this._showing_set) {
            // FIXME: Would really be better to draw inside the frame directly
            // than try to suss out the position here. Really really, lets just
            // make this a border image in css
            let margin = this._thumbnail_frame.margin;
            let sleeve_alloc = this._shadow_frame.get_allocation();
            let sleeve_offset = this._shadow_frame.get_window().get_position()[1] - this._overlay.get_allocation().y;
            let shadow_top = sleeve_alloc.y + sleeve_alloc.height + sleeve_offset;

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
