// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardsSegment = imports.app.cardsSegment;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const SectionPage = imports.app.sectionPage;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SectionPageA
 *
 * This class extends <SectionPage> and represents the section page for
 * template A of the knowledge apps.
 * In addition to the 'title' property published by <SectionPage>, it has
 * a set of articles to show. Articles are represented by cards. Cards are
 * displayed using a <GridArrangement>.
 *
 */
const SectionPageA = new Lang.Class({
    Name: 'SectionPageA',
    GTypeName: 'EknSectionPageA',
    Extends: SectionPage.SectionPage,

    LOADING_BOTTOM_BUFFER: 250,

    _init: function (props) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        props.valign = Gtk.Align.FILL;

        this.parent(props);

        this._cards = [];

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_A);

        this._arrangement = this.factory.create_named_module('results-arrangement', {
            bottom_buffer: this.LOADING_BOTTOM_BUFFER,
        });

        this._arrangement.connect('need-more-content', () =>
            this.emit('load-more-results'));

        this._separator = new Gtk.Separator({
            margin_start: 20,
            margin_end: 20,
        });
        this.attach(this._separator, 0, 1, 1, 1);

        this.attach(this._arrangement, 0, 2, 1, 1);
    },

    pack_title_banner: function (title_banner) {
        title_banner.halign = Gtk.Align.CENTER;

        let old_banner = this.get_child_at(0, 0);
        if (old_banner)
            this.remove(old_banner);
        this.attach(title_banner, 0, 0, 1, 1);
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._arrangement.add_card, this._arrangement);
    },

    get_cards: function () {
        return this._cards;
    },

    remove_all_cards: function () {
        this._arrangement.clear();
        this._cards = [];
    },
});
