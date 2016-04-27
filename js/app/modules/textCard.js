// Copyright (C) 2014-2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const NavigationCard = imports.app.interfaces.navigationCard;
const StyleClasses = imports.app.styleClasses;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

// The highlight decoration element is 5x5
const HIGHLIGHT_DECORATION_DIMENSION = 5;

/**
 * Class: TextCard
 *
 * Class to show text-only cards in the knowledge lib UI
 *
 * This widget displays a clickable topic to the user.
 * Connect to the <clicked> signal to perform an action
 * when the user clicks on the card.
 *
 * Style classes:
 *   card, text-card - on the widget itself
 *   title - on the title label
 */
const TextCard = new Module.Class({
    Name: 'TextCard',
    CssName: 'EknTextCard',
    Extends: Gtk.Button,
    Implements: [Card.Card, NavigationCard.NavigationCard],

    Properties: {
        /**
         * Property: underline-on-hover
         * Whether to underline the link on hover
         */
        'underline-on-hover': GObject.ParamSpec.boolean('underline-on-hover',
            'Underline on hover', 'Whether to underline the link on hover',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: decorate-on-highlight
         * Whether to draw a custom decoration when the card is highlighted
         */
        'decorate-on-highlight': GObject.ParamSpec.boolean('decorate-on-highlight',
            'Decorate on highlight', 'Whether to draw a custom decoration when the card is highlighted',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/textCard.ui',
    InternalChildren: [ 'grid', 'title-label' ],

    _init: function (params={}) {
        this.parent(params);

        Utils.set_hand_cursor_on_widget(this);
        this.set_title_label_from_model(this._title_label);
        this._title_label_text = this._title_label.label;

        // FIXME: this should be in CSS, but "text-decoration" isn't supported
        if (this.underline_on_hover) {
            this.connect('enter-notify-event', () => {
                this._title_label.label = '<u>' + this._title_label_text + '</u>';
                return Gdk.EVENT_PROPAGATE;
            });
            this.connect('leave-notify-event', () => {
                this._title_label.label = this._title_label_text;
                return Gdk.EVENT_PROPAGATE;
            });
        }

        let before = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        before.get_style_context().add_class(StyleClasses.BEFORE);
        this._grid.attach(before, 0, 0, 1, 1);
        let after = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        after.get_style_context().add_class(StyleClasses.AFTER);
        this._grid.attach(after, 2, 0, 1, 1);
    },

    vfunc_draw: function (cr) {
        if (this.decorate_on_highlight && this.get_style_context().has_class(StyleClasses.HIGHLIGHTED)) {
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

function get_css_for_module (css_data) {
    let str = '@define-color template-b-text-color ' + css_data['title-color'] + ';\n';
    str += '@define-color template-b-text-color-hover ' + css_data['hover-color'] + ';\n';
    return str;
}
