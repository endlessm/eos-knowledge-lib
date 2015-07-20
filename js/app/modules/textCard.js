// Copyright 2014 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
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
 *   decoration - on the decorative bullet label
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
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),

        /**
         * Property: underline-on-hover
         * Whether to underline the link on hover
         */
        'underline-on-hover': GObject.ParamSpec.boolean('underline-on-hover',
            'Underline on hover', 'Whether to underline the link on hover',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),

        /**
         * Property: decoration
         * Whether to add a decorative bullet to the label
         */
        'decoration': GObject.ParamSpec.boolean('decoration', 'Decoration',
            'Whether to add a decorative bullet to the label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/textCard.ui',
    InternalChildren: [ 'decoration-label', 'title-label' ],

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

        if (this.decoration) {
            this._decoration_label.no_show_all = false;
            this._decoration_label.show();
        }
    },
});

function get_css_for_module (css_data) {
    let str = '@define-color template-b-text-color ' + css_data['title-color'] + ';\n';
    str += '@define-color template-b-text-color-hover ' + css_data['hover-color'] + ';\n';
    return str;
}
