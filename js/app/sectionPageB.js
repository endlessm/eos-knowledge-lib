// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SectionPage = imports.app.sectionPage;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SectionPageB
 *
 * This class extends <SectionPage> and represents the section page for
 * template B of the knowledge apps.
 * It has a title and a set of articles to show. Articles are represented
 * by text cards.
 *
 */
const SectionPageB = new Lang.Class({
    Name: 'SectionPageB',
    GTypeName: 'EknSectionPageB',
    Extends: SectionPage.SectionPage,
    Properties: {
        /**
         * Property: cards
         * A list of <TextCard> widgets representing the cards to be displayed
         * on this section.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    _init: function (props) {
        this._cards = [];

        props.expand = true;
        this.parent(props);

        this._content_grid = new Gtk.Grid();

        this._title_frame = new Gtk.Frame();
        this._title_frame.get_style_context().add_class(StyleClasses.SECTION_PAGE_B_TITLE_FRAME);

        this._content_grid.add(this._title_frame);

        this._arrangement = this.factory.create_named_module('results-arrangement', {
            preferred_width: 400,
            hexpand: false,
        });
        this._arrangement.connect('need-more-content', () =>
            this.emit('load-more-results'));
        this._content_grid.add(this._arrangement);

        this.add(this._content_grid);

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
    },

    highlight_card: function (model) {
        this._arrangement.highlight(model);
    },

    clear_highlighted_cards: function () {
        this._arrangement.clear_highlight();
    },

    pack_title_banner: function (title_banner) {
        title_banner.valign = Gtk.Align.END;
        title_banner.max_width_chars = 0;

        let child = this._title_frame.get_child();
        if (child !== null)
            this._title_frame.remove(child);
        this._title_frame.add(title_banner);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards)
            this._arrangement.clear();
        this._cards = v;
        if (this._cards)
            this._cards.forEach(this._arrangement.add_card, this._arrangement);
    },

    get cards () {
        return this._cards;
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._arrangement.add_card, this._arrangement);
    },
});
