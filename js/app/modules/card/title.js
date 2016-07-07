// Copyright 2014 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const NavigationCard = imports.app.interfaces.navigationCard;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

// The highlight decoration element is 5x5
const HIGHLIGHT_DECORATION_DIMENSION = 5;

/**
 * Class: Title
 *
 * Class to show text-only cards in the knowledge lib UI
 *
 * This widget displays a clickable topic to the user.
 * Connect to the <clicked> signal to perform an action
 * when the user clicks on the card.
 *
 * Style classes:
 *   card, title-card - on the widget itself
 *   title - on the title label
 */
const Title = new Module.Class({
    Name: 'Card.Title',
    Extends: Gtk.Button,
    Implements: [Card.Card, NavigationCard.NavigationCard],

    Properties: {
        /**
         * Property: decorate-on-highlight
         * Whether to draw a custom decoration when the card is highlighted
         */
        'decorate-on-highlight': GObject.ParamSpec.boolean('decorate-on-highlight',
            'Decorate on highlight', 'Whether to draw a custom decoration when the card is highlighted',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/title.ui',
    InternalChildren: [ 'grid', 'title-label' ],

    _init: function (params={}) {
        this.parent(params);

        Utils.set_hand_cursor_on_widget(this);
        this.set_title_label_from_model(this._title_label);
        this._title_label_text = this._title_label.label;

        let before = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        let before_class = Utils.get_element_style_class(Title, 'before');
        before.get_style_context().add_class(before_class);
        this._grid.attach(before, 0, 0, 1, 1);
        let after = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        let after_class = Utils.get_element_style_class(Title, 'after');
        after.get_style_context().add_class(after_class);
        this._grid.attach(after, 2, 0, 1, 1);
    },

    vfunc_draw: function (cr) {
        if (this.decorate_on_highlight && this.get_style_context().has_class('highlighted')) {
            let x = this.get_allocation().width;
            let y = this._title_label.get_allocation().height;

            cr.save();
            Gdk.cairo_set_source_rgba(cr, new Gdk.RGBA({
                red: 1.0,
                green: 1.0,
                blue: 1.0,
                alpha: 1.0,
            }));
            cr.moveTo(0, y);
            cr.lineTo((x - HIGHLIGHT_DECORATION_DIMENSION) / 2, y);
            cr.lineTo(x / 2, y + (HIGHLIGHT_DECORATION_DIMENSION / 2));
            cr.lineTo((x + HIGHLIGHT_DECORATION_DIMENSION) / 2, y);
            cr.lineTo(x, y);
            cr.stroke();
            cr.restore();
        }

        this.parent(cr);

        cr.$dispose();
        return Gdk.EVENT_PROPAGATE;
    },
});
