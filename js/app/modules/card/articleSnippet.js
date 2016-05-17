// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: ArticleSnippet
 * Widget to display an article snippet
 *
 * Displays a snippet with a title and a couple of lines of synopsis.
 *
 * CSS classes:
 *   article-snippet - on the widget itself
 *   title - on the <Card.title_label>
 *   synopsis - on the <Card.synopsis_label>
 */
const ArticleSnippet = new Module.Class({
    Name: 'ArticleSnippetCard',
    CssName: 'EknArticleSnippetCard',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/articleSnippetCard.ui',
    InternalChildren: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        Utils.set_hand_cursor_on_widget(this);

        this.set_title_label_from_model(this._title_label);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        this.set_style_variant_from_model();
    },
});

function get_css_for_module (css_data, num) {
    return Utils.get_css_for_title_and_module(css_data,
        '.article-snippet.variant' + num + ' .title',
        '.article-snippet.variant' + num + ' .synopsis');
}
