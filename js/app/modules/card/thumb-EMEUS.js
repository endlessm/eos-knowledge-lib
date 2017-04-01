// Copyright 2017 Endless Mobile, Inc.

const Emeus = imports.gi.Emeus;
const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

GObject.type_ensure(Emeus.ConstraintLayout.$gtype)

const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

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
    InternalChildren: [ 'layout', 'text-layout',  'title-label', 'synopsis-label', 'grid', 'thumbnail-frame'],

    _init: function (props={}) {
        this.parent(props);

        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        this.set_title_label_from_model(this._title_label);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._context_widget = this.create_context_widget_from_model();
        this._context_widget.halign = Gtk.Align.START;
        this._text_layout.add(this._context_widget);

        this.set_size_request(Card.MinSize.B, Card.MinSize.B);

        this.show_all();

        Utils.set_hand_cursor_on_widget(this);
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
                target_object: this._context_widget,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._context_widget,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_object: this._title_label,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_widget,
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
                target_object: this._context_widget,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_attribute: Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._context_widget,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._context_widget,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
        ];
    },

    _main_layout: function (image_portion_attr, image_full_attr) {
        let constraints = [
            {
                target_object: this._thumbnail_frame,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_attribute: Emeus.ConstraintAttribute.TOP,
                // card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.TOP * 1 + 0
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
                // card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.LEFT * 1 + 0
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: image_portion_attr,
                source_attribute: image_portion_attr,
                multiplier: 0.60,
                // HORIZ: equation: card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.WIDTH * 0.66 + 0
                // VERTI: equation: card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.HEIGHT * 0.66 + 0
            },
            {
                target_object: this._thumbnail_frame,
                target_attribute: image_full_attr,
                source_attribute: image_full_attr,
                // HORIZ: equation: card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.HEIGHT * 1 + 0
                // VERT: equation: card._thumbnail_frame = cardparent.Emeus.ConstraintAttribute.WIDTH * 1 + 0
            },
            {
                target_object: this._grid,
                target_attribute: Emeus.ConstraintAttribute.RIGHT,
                source_attribute: Emeus.ConstraintAttribute.RIGHT,
                // card._grid = cardparent.Emeus.ConstraintAttribute.RIGHT * 1 + 0
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
                multiplier: 0.40,
            },
            {
                target_object: this._grid,
                target_attribute: image_full_attr,
                source_attribute: image_full_attr,
            },
        ];
        constraints.forEach((props) => {
            let c = new Emeus.Constraint(props);
            this._layout.add_constraint(c)
        });
    },

    vfunc_size_allocate: function (alloc) {
        this._layout.clear_constraints();
        this._text_layout.clear_constraints();
        let orientation = this._get_orientation(alloc.width, alloc.height);

        let show_synopsis = this._should_show_synopsis(alloc.width, alloc.height, orientation);

        let show_context = this._should_show_context(alloc.width, alloc.height);

        let text_constraints;
        if (orientation === Gtk.Orientation.HORIZONTAL) {
            this._main_layout(Emeus.ConstraintAttribute.WIDTH, Emeus.ConstraintAttribute.HEIGHT);
            text_constraints = this._get_constraints_horizontal(show_synopsis);
            this._title_label.lines = 3;
        } else {
            this._main_layout(Emeus.ConstraintAttribute.HEIGHT, Emeus.ConstraintAttribute.WIDTH);
            text_constraints = this._get_constraints_vertical(show_context);
            this._title_label.lines = 1;
        }

        if (show_synopsis) {
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        } else {
            this._synopsis_label.hide();
        }

        this._context_widget.visible = show_context;

        text_constraints.forEach((props) => {
            let c = new Emeus.Constraint(props);
            this._text_layout.add_constraint(c);
        });
        this.parent(alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
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
