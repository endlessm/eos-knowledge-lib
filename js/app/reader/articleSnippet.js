// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const Card = imports.app.interfaces.card;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

/**
 * Class: Reader.ArticleSnippet
 * Widget to display an article snippet in the <OverviewPage>
 *
 * CSS classes:
 *   article-snippet - on the widget itself
 *   title - on the <Card.title_label>
 *   synopsis - on the <Card.synopsis_label>
 */
const ArticleSnippet = new Lang.Class({
    Name: 'ArticleSnippet',
    GTypeName: 'EknArticleSnippet',
    Extends: Gtk.Button,
    Implements: [ Card.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        /**
         * Property: style-variant
         * Which style variant to use for appearance
         *
         * Which CSS style variant to use (default is zero.)
         * If the variant does not exist then the snippet will have only the
         * styles common to all variants.
         * Use -1 as a variant that is guaranteed not to exist.
         */
        'style-variant': GObject.ParamSpec.int('style-variant', 'Style variant',
            'Which CSS style variant to use for appearance',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT16, 0),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/articleSnippet.ui',
    Children: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
        Utils.set_hand_cursor_on_widget(this);

        if (this.style_variant >= 0)
            this.get_style_context().add_class('snippet' + this.style_variant);
    },
});

function get_css_for_module (css_data, num) {
    let title_data = Utils.get_css_for_submodule('title', css_data);
    let str = Utils.object_to_css_string(title_data, '.snippet' + num + ' .title');
    let module_data = Utils.get_css_for_submodule('module', css_data);
    str += Utils.object_to_css_string(module_data, '.snippet' + num + ' .synopsis');
    return str;
}
