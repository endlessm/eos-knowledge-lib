// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

/**
 * Class: Reader.ArticleSnippetCard
 * Widget to display an article snippet in the <OverviewPage>
 *
 * CSS classes:
 *   article-snippet - on the widget itself
 *   title - on the <Card.title_label>
 *   synopsis - on the <Card.synopsis_label>
 */
const ArticleSnippetCard = new Lang.Class({
    Name: 'ArticleSnippetCard',
    GTypeName: 'EknArticleSnippetCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/articleSnippetCard.ui',
    Children: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
        Utils.set_hand_cursor_on_widget(this);

        if (this.model.article_number !== undefined) {
            let style = this.model.article_number % 3;
            this.get_style_context().add_class('snippet' + style);
        }
    },
});

function get_css_for_module (css_data, num) {
    let title_data = Utils.get_css_for_submodule('title', css_data);
    let str = Utils.object_to_css_string(title_data, '.snippet' + num + ' .title');
    let module_data = Utils.get_css_for_submodule('module', css_data);
    str += Utils.object_to_css_string(module_data, '.snippet' + num + ' .synopsis');
    return str;
}
