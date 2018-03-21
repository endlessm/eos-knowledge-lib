// Copyright 2017 Endless Mobile, Inc.

const Emeus = imports.gi.Emeus;
const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

GObject.type_ensure(Emeus.ConstraintLayout.$gtype)

const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

const CardType = {
    LOW_RES_IMAGE: 0,
    MED_RES_IMAGE: 1,
    HIGH_RES_IMAGE: 2,
};

const THRESHOLDS = {
    LOW_RES_IMAGE: {
        width: 600,
        height: 400,
    },
    MED_RES_IMAGE: {
        width: 800,
        height: 600,
    },
    HIGH_RES_IMAGE: {
        width: 1200,
        height: 1000,
    },
};

const CARD_POLAROID_VERTICAL_HEIGHTS = {
    XSMALL: 80,
    SMALL: 120,
    MEDIUM: 140,
    LARGE: 220,
};

/**
 * Class: Default
 *
 * A card displaying a thumbnail with an area underneath for title and tag
 * information.
 */
var Default = new Module.Class({
    Name: 'Card.Default',
    Extends: Gtk.Button,
    Implements: [View, Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/default.ui',
    InternalChildren: [ 'layout', 'inner-content-grid', 'thumbnail-frame',
                        'grid', 'title-label', 'synopsis-label', 'context-frame',
                        'thumbnail-overlay', 'content-overlay', 'title-box'],
    Properties: {
        /**
         * Property: justify
         * Horizontal justification of the title, synopsis and context
         *
         * Default value:
         *   **Gtk.Justification.LEFT**
         */
        'justify': GObject.ParamSpec.enum('justify',
            'Justify', 'Horizontal justification of the title, synopsis and context',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Justification.$gtype, Gtk.Justification.LEFT),
    },

    _init: function (props={}) {
        Object.defineProperties(this, {
            /**
             * Property: excluded_types
             * List of card types excluded from this family
             *
             */
            'excluded_types': {
                value: props.excluded_types ? props.excluded_types.slice(0) : [],
                writable: false,
            },
        });
        delete props.excluded_types;
        this.parent(props);

        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        this.set_title_label_from_model(this._title_label);

        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._context_widget = this.create_context_widget_from_model();
        this._context_frame.add(this._context_widget);
        this._setup_justification();

        this.set_size_request(Card.MinSize.B, Card.MinSize.B);

        this.show_all();

        Utils.set_hand_cursor_on_widget(this);
        this._card_type = this._get_card_type();

        if (this._card_type === CardType.HIGH_RES_IMAGE)
            this.set_media_overlay_from_model(this._content_overlay);
        else
            this.set_media_overlay_from_model(this._thumbnail_overlay);
    },

    _setup_justification: function () {
        const props = {
            halign: Gtk.Align.START,
            justify: Gtk.Justification.LEFT,
            xalign: 0,
        };
        if (this.justify === Gtk.Justification.CENTER) {
            props.halign = Gtk.Align.CENTER;
            props.justify = Gtk.Justification.CENTER;
            props.xalign = 0.5;
        } else if (this.justify === Gtk.Justification.FILL) {
            props.halign = Gtk.Align.FILL;
            props.justify = Gtk.Justification.FILL;
            props.xalign = 0;
        } else if (this.justify === Gtk.Justification.RIGHT) {
            props.halign = Gtk.Align.END;
            props.justify = Gtk.Justification.RIGHT;
            props.xalign = 1;
        }
        Object.assign(this._title_label, props);
        Object.assign(this._synopsis_label, props);
        this._context_frame.halign = props.halign;
    },

    _get_card_type: function () {
        if (!this.model.thumbnail_uri)
            return CardType.LOW_RES_IMAGE;
        let file = Gio.File.new_for_uri(this.model.thumbnail_uri);
        let stream = file.read(null);
        let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
        let width = pixbuf.get_width();
        let height = pixbuf.get_height();

        let chosen_type;
        Object.keys(CardType)
        .filter((key) => this.excluded_types.indexOf(CardType[key]) < 0)
        .every((key) => {
            chosen_type = CardType[key];
            if (width > THRESHOLDS[key].width && height > THRESHOLDS[key].height) {
                return true;
            }
            return false;
        });
        return chosen_type;
    },

    // Layout for Polaroid card in horizontal orientation.
    // This orientation always shows the context.
    _get_constraints_polaroid_card_horizontal: function (show_synopsis) {
        return [
            {
                target_object: this._title_box,
                target_attribute: show_synopsis ? Emeus.ConstraintAttribute.BOTTOM : Emeus.ConstraintAttribute.CENTER_Y,
                source_object: show_synopsis ? this._synopsis_label : null,
                source_attribute: show_synopsis ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.RIGHT,
                source_attribute: Emeus.ConstraintAttribute.RIGHT,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_attribute: Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._synopsis_label,
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

    // Layout for Polaroid card in vertical orientation.
    // This orientation never shows the synopsis.
    get_constraints_polaroid_card_vertical: function (show_context) {
        return [
            {
                target_object: this._title_box,
                target_attribute: show_context ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.CENTER_Y,
                source_attribute: show_context ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._title_box,
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

    // Layout for Post card. This card never shows the synopsis.
    _get_constraints_post_card: function (show_context) {
        return [
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_attribute: Emeus.ConstraintAttribute.TOP,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                source_object: show_context ? this._context_frame : null,
                source_attribute: show_context ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.BOTTOM,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._title_box,
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

    // Layout for all text card.
    _get_constraints_text_card: function (show_synopsis) {
        return [
            {
                target_object: this._title_box,
                target_attribute: show_synopsis ? Emeus.ConstraintAttribute.BOTTOM : Emeus.ConstraintAttribute.CENTER_Y,
                source_object: show_synopsis ? this._synopsis_label : null,
                source_attribute: show_synopsis ? Emeus.ConstraintAttribute.TOP : Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            },
            {
                target_object: this._title_box,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_attribute: Emeus.ConstraintAttribute.CENTER_Y,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_object: this._title_box,
                source_attribute: Emeus.ConstraintAttribute.LEFT,
            },
            {
                target_object: this._synopsis_label,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_object: this._title_box,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
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

    _main_layout: function (card_width, card_height, text_fraction, text_constant, text_portion_attr, text_full_attr) {
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
                target_attribute: text_full_attr,
                source_attribute: text_full_attr,
            },
            {
                target_object: this._grid,
                target_attribute: text_full_attr,
                source_attribute: text_full_attr,
            }
        ];

        // If it's a card with no image, align the text layout along the top left of
        // the parent card. Otherwise, align it along the right bottom.
        if (text_fraction == 1) {
            constraints.push(
                {
                    target_object: this._grid,
                    target_attribute: Emeus.ConstraintAttribute.TOP,
                    source_attribute: Emeus.ConstraintAttribute.TOP,
                },
                {
                    target_object: this._grid,
                    target_attribute: Emeus.ConstraintAttribute.LEFT,
                    source_attribute: Emeus.ConstraintAttribute.LEFT,
                }
            );
        } else {
            constraints.push(
                {
                    target_object: this._grid,
                    target_attribute: Emeus.ConstraintAttribute.RIGHT,
                    source_attribute: Emeus.ConstraintAttribute.RIGHT,
                },
                {
                    target_object: this._grid,
                    target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                    source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                }
            );
        }

        // If a constant is given for the text box, make this._thumbnail_frame
        // a constant size. If no constant is given, size this._thumbnail_frame
        // based on the fraction given.
        if (text_constant != null) {
            constraints.push(
                {
                    target_object: this._thumbnail_frame,
                    target_attribute: text_portion_attr,
                    constant: text_portion_attr == Emeus.ConstraintAttribute.WIDTH ? card_width - text_constant : card_height - text_constant,
                },
                {
                    target_object: this._grid,
                    target_attribute: text_portion_attr,
                    constant: text_constant,
                }
            );
        } else {
            constraints.push (
                {
                    target_object: this._thumbnail_frame,
                    target_attribute: text_portion_attr,
                    source_attribute: text_portion_attr,
                    multiplier: text_fraction < 1 && text_fraction > 0 ? 1 - text_fraction : 1,
                },
                {
                    target_object: this._grid,
                    target_attribute: text_portion_attr,
                    source_attribute: text_portion_attr,
                    multiplier: text_fraction,
                }
            );
        }

        constraints.forEach((props) => {
            let c = new Emeus.Constraint(props);
            this._layout.add_constraint(c)
        });
    },

    vfunc_size_allocate: function (alloc) {
        let card_margins = this._get_margins();
        let real_alloc_width = alloc.width - (card_margins.left + card_margins.right);
        let real_alloc_height = alloc.height - (card_margins.top + card_margins.bottom);

        this._layout.clear_constraints();
        this._inner_content_grid.clear_constraints();

        let orientation = this._get_orientation(real_alloc_width, real_alloc_height);
        let show_synopsis = this._should_show_synopsis(this._card_type, real_alloc_width, real_alloc_height, orientation);
        let show_context = this._should_show_context(this._card_type, real_alloc_width, real_alloc_height);
        let text_constraints;

        if (this._card_type === CardType.HIGH_RES_IMAGE) {
            this.get_style_context().add_class('CardPost');
            show_synopsis = false;
            this._title_label.lines = 2;
            this._title_label.valign = Gtk.Align.END;
            this._main_layout(
                real_alloc_width,
                real_alloc_height,
                1,
                null,
                Emeus.ConstraintAttribute.WIDTH,
                Emeus.ConstraintAttribute.HEIGHT
            );
            text_constraints = this._get_constraints_post_card(show_context);
        } else if (this._card_type === CardType.MED_RES_IMAGE) {
            this.get_style_context().add_class('CardPolaroid');
            if (orientation === Gtk.Orientation.HORIZONTAL) {
                if (real_alloc_width > Card.MaxSize.E) {
                    this._main_layout(
                        real_alloc_width,
                        real_alloc_height,
                        null,
                        390,
                        Emeus.ConstraintAttribute.WIDTH,
                        Emeus.ConstraintAttribute.HEIGHT
                    );
                } else {
                    this._main_layout(
                        real_alloc_width,
                        real_alloc_height,
                        0.50,
                        null,
                        Emeus.ConstraintAttribute.WIDTH,
                        Emeus.ConstraintAttribute.HEIGHT
                    );
                }
                text_constraints = this._get_constraints_polaroid_card_horizontal(show_synopsis);
                this._title_label.lines = 3;
                if (show_synopsis) {
                    this._title_label.valign = Gtk.Align.END;
                } else {
                    this._title_label.valign = Gtk.Align.CENTER;
                }
            } else {
                let inner_content_grid_height;
                if ((real_alloc_width < Card.MaxSize.C && real_alloc_height < Card.MaxSize.B) || (real_alloc_width < Card.MaxSize.B && real_alloc_height < Card.MaxSize.C)) {
                    inner_content_grid_height = CARD_POLAROID_VERTICAL_HEIGHTS.XSMALL;
                } else if (real_alloc_width < Card.MaxSize.D && real_alloc_height < Card.MaxSize.C) {
                    inner_content_grid_height = CARD_POLAROID_VERTICAL_HEIGHTS.SMALL;
                } else if (real_alloc_width < Card.MaxSize.D) {
                    inner_content_grid_height = CARD_POLAROID_VERTICAL_HEIGHTS.MEDIUM;
                } else if (real_alloc_width < Card.MaxSize.E) {
                    inner_content_grid_height = CARD_POLAROID_VERTICAL_HEIGHTS.LARGE;
                }
                this._main_layout(
                    real_alloc_width,
                    real_alloc_height,
                    null,
                    inner_content_grid_height,
                    Emeus.ConstraintAttribute.HEIGHT,
                    Emeus.ConstraintAttribute.WIDTH
                );
                text_constraints = this.get_constraints_polaroid_card_vertical(show_context);
                if (show_context && ((real_alloc_height <= Card.MaxSize.B && real_alloc_width <= Card.MaxSize.C) || (real_alloc_height <= Card.MaxSize.C && real_alloc_width <= Card.MaxSize.B))) {
                    this._title_label.lines = 1;
                } else {
                    this._title_label.lines = 2;
                    this._title_box.valign = Gtk.Align.CENTER;
                }
            }
        } else if (this._card_type === CardType.LOW_RES_IMAGE) {
            this.get_style_context().add_class('CardText');
            this._thumbnail_frame.hide();
            // Title lines
            if (real_alloc_height < Card.MaxSize.B) {
                this._title_label.lines = 2;
            } else {
                this._title_label.lines = 3;
            }
            // Synopsis lines
            if (real_alloc_height < Card.MaxSize.B) {
                this._synopsis_label.lines = 2;
            } else if (real_alloc_height < Card.MaxSize.C) {
                this._synopsis_label.lines = 4;
            } else {
                this._synopsis_label.lines = 6;
            }
            if (show_synopsis) {
                this._title_label.valign = Gtk.Align.END;
            } else {
                this._title_label.valign = Gtk.Align.CENTER;
            }
            this._main_layout(
                real_alloc_width,
                real_alloc_height,
                1,
                null,
                Emeus.ConstraintAttribute.HEIGHT,
                Emeus.ConstraintAttribute.WIDTH
            );
            text_constraints = this._get_constraints_text_card(show_synopsis);
        }

        if (show_synopsis) {
            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        } else {
            this._synopsis_label.hide();
        }

        this._context_frame.visible = show_context;

        text_constraints.forEach((props) => {
            let c = new Emeus.Constraint(props);
            this._inner_content_grid.add_constraint(c);
        });

        // Only one direct child, we give it all available space regardless of
        // its request
        void this._layout.get_preferred_width();
        this.parent(alloc);
        this.update_card_sizing_classes(real_alloc_height, real_alloc_width);
    },

    _get_orientation: function (width, height) {
        let horizontal = (width > Card.MaxSize.C && height < Card.MinSize.C) ||
            (width > Card.MaxSize.D && height < Card.MinSize.E) ||
            (width > Card.MaxSize.E);
        return horizontal ? Gtk.Orientation.HORIZONTAL : Gtk.Orientation.VERTICAL;
    },

    _should_show_synopsis: function (card_type, width, height, orientation) {
        if (card_type == CardType.LOW_RES_IMAGE) {
            return !((height < Card.MaxSize.C && width > Card.MinSize.E) || (height < Card.MaxSize.A));
        } else if (card_type == CardType.MED_RES_IMAGE) {
            return height > Card.MaxSize.C && width > Card.MaxSize.E && orientation == Gtk.Orientation.HORIZONTAL;
        } else {
            return false;
        }
    },

    _should_show_context: function (card_type, width, height) {
        if (card_type == CardType.LOW_RES_IMAGE) {
            return true;
        } else if (card_type == CardType.MED_RES_IMAGE) {
            return !(width <= Card.MaxSize.B && height <= Card.MaxSize.C);
        } else {
            return !(height < Card.MinSize.C && width < Card.MinSize.C);
        }
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
});
