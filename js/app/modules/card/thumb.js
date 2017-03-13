// Copyright 2017 Endless Mobile, Inc.

const Emeus = imports.gi.Emeus;
const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

GObject.type_ensure(Emeus.ConstraintLayout.$gtype)

const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const CardType = {
    LOW_RES_IMAGE: 0,
    MED_RES_IMAGE: 1,
    HIGH_RES_IMAGE: 2,
};

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
    InternalChildren: [ 'layout', 'text-layout', 'thumbnail-frame',
                        'grid', 'title-label', 'synopsis-label', 'context-frame'],

    _init: function (props={}) {
        this.parent(props);

        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        this.set_title_label_from_model(this._title_label);

        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._context_frame.add(this.create_context_widget_from_model());

        this.show_all();

        Utils.set_hand_cursor_on_widget(this);
        this._card_type = this._get_card_type();
    },

    // FIXME: This should examine the card's thumbnail to determine which card
    // type to return.
    _get_card_type: function () {
        return GLib.random_int_range(CardType.LOW_RES_IMAGE, CardType.HIGH_RES_IMAGE + 1);
    },

    _get_constraints_horizontal: function (show_synopsis) {
        return [
            {
                target_object: this._title_label,
                target_attribute: show_synopsis ? Emeus.ConstraintAttribute.BOTTOM : Emeus.ConstraintAttribute.CENTER_Y,
                relation: Emeus.ConstraintRelation.EQ,
                source_attribute: Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.RIGHT,
                source_attribute: Emeus.ConstraintAttribute.RIGHT,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
        ];
    },

    // Vertical layout never shows the synopsis
    _get_constraints_vertical: function (show_context) {
        return [
            {
                target_object: this._title_label,
                target_attribute: show_context ? Emeus.ConstraintAttribute.BOTTOM : Emeus.ConstraintAttribute.CENTER_Y,
                source_attribute: Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
        ];
    },

    // PostCard never shows the synopsis.
    _get_constraints_post_card: function (show_context) {
        return [
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: show_context ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.BOTTOM,
                source_object: show_context ? this._context_frame : null,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._title_label,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._context_frame,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
        ];
    },

    _main_layout: function (image_fraction, image_portion_attr, image_full_attr) {
        let constraints = [
            {
                target_object: this._thumbnail_frame,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_attribute: Emeus.ConstraintAttribute.TOP,
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: image_portion_attr,
                source_attribute: image_portion_attr,
                multiplier: image_fraction,
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: image_full_attr,
                source_attribute: image_full_attr,
            },
            {
                target_object: this._grid,
                target_attribute: Emeus.ConstraintAttribute.RIGHT,
                source_attribute: Emeus.ConstraintAttribute.RIGHT,
            },
            {
                target_object: this._grid,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._grid,
                target_attribute: image_portion_attr,
                source_attribute: image_portion_attr,
                // In case where image takes up entire card (PostCard) or none
                // of card (TextCard), then text section should sit on top of
                // image.
                multiplier: image_fraction < 1 && image_fraction > 0 ? 1 - image_fraction : 1,
            },
            {
                target_object: this._grid,
                target_attribute: image_full_attr,
                source_attribute: image_full_attr,
            },
        ];
        constraints.forEach((props) => this._add_constraint(props, this._layout));
    },

    vfunc_size_allocate: function (alloc) {
        this._layout.clear_constraints();
        this._text_layout.clear_constraints();

        let orientation = this._get_orientation(alloc.width, alloc.height);

        let show_context = this._should_show_context(alloc.width, alloc.height);
        let show_synopsis = this._should_show_synopsis(alloc.width, alloc.height, orientation);
        let text_constraints;
        if (this._card_type === CardType.HIGH_RES_IMAGE) {
            this.get_style_context().add_class('good-image')
            show_synopsis = false;
            this._title_label.lines = 2;
            this._title_label.halign = Gtk.Align.CENTER;
            this._title_label.justify = Gtk.Justification.CENTER;
            this._title_label.xalign = 0.5;
            this._main_layout(1, Emeus.ConstraintAttribute.WIDTH, Emeus.ConstraintAttribute.HEIGHT);
            text_constraints = this._get_constraints_post_card(show_context);
        } else {
            if (orientation === Gtk.Orientation.HORIZONTAL) {
                this._main_layout(0.66, Emeus.ConstraintAttribute.WIDTH, Emeus.ConstraintAttribute.HEIGHT);
                text_constraints = this._get_constraints_horizontal(show_synopsis);
                this._title_label.lines = 3;
            } else {
                this._main_layout(0.66, Emeus.ConstraintAttribute.HEIGHT, Emeus.ConstraintAttribute.WIDTH);
                text_constraints = this._get_constraints_vertical(show_context);
                this._title_label.lines = 1;
            }
        }

        if (show_synopsis) {
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        } else {
            this._synopsis_label.hide();
        }

        this._context_frame.visible = show_context;

        text_constraints.forEach((props) => this._add_constraint(props, this._text_layout));
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    _add_constraint: function (props, layout) {
        props.constant = props.constant || 0;
        props.multiplier = props.multiplier || 1;
        props.relation = props.relation || Emeus.ConstraintRelation.EQ;
        props.source_object = props.source_object || null;
        props.strength = props.strength || Emeus.ConstraintStrength.REQUIRED;
        let c = new Emeus.Constraint(props);
        layout.add_constraint(c);
    },

    _get_orientation: function (width, height) {
        let horizontal = (width > Card.MaxSize.C && height < Card.MinSize.C) ||
            (width > Card.MaxSize.D && height < Card.MinSize.D) ||
            (width > Card.MaxSize.E && height < Card.MinSize.E) ||
            (width > Card.MaxSize.F);
        return horizontal ? Gtk.Orientation.HORIZONTAL : Gtk.Orientation.VERTICAL;
    },

    _should_show_synopsis: function (width, height, orientation) {
        return height > Card.MaxSize.C && orientation == Gtk.Orientation.HORIZONTAL;
    },

    _should_show_context: function (width, height) {
        return !(width <= Card.MaxSize.B || (width <= Card.MaxSize.C && height <= Card.MaxSize.B));
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround bug for not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },
});
