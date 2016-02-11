// Copyright 2014 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

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
const TextCard = new Lang.Class({
    Name: 'TextCard',
    GTypeName: 'EknTextCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),

        /**
         * Property: underline-on-hover
         * Whether to underline the link on hover
         */
        'underline-on-hover': GObject.ParamSpec.boolean('underline-on-hover',
            'Underline on hover', 'Whether to underline the link on hover',
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
});

function get_css_for_module (css_data) {
    let str = '@define-color template-b-text-color ' + css_data['title-color'] + ';\n';
    str += '@define-color template-b-text-color-hover ' + css_data['hover-color'] + ';\n';
    return str;
}
