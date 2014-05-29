// Copyright 2014 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SectionPage = imports.sectionPage;

/**
 * Class: SectionPageB
 *
 * This class extends <SectionPage> and represents the section page for 
 * template B of the knowledge apps.
 * It will also be used as the search results page for template B.
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
        props = props || {};

        props.vexpand = true;
        props.valign = Gtk.Align.FILL;

        this._widget_container = new SectionPageBWidgetContainer();

        this.parent(props);

        this._cards = null;

        this.add(this._widget_container);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_B);
        this.show_all();
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            this._widget_container.remove_cards(this._cards);
        }

        this._cards = v;
        if (this._cards !== null) {
            this._widget_container.add_cards(this._cards);
        }
    },

    get cards () {
        return this._cards;
    },

    set title (v) {
        if (this._title === v)
            return;
        this._title = v;
        this._widget_container.set_title(this._title);
    },

    get title () {
        return this._title;
    }
});

// Private class to handle the special widget container we need on the section page.
// It holds the title label and a scrollable card container.
const SectionPageBWidgetContainer = new Lang.Class({
    Name: 'SectionPageBWidgetContainer',
    GTypeName: 'EknSectionPageBWidgetContainer',
    Extends: Endless.CustomContainer,

    MINIMUM_WIDTH: 335,
    SCROLLER_WIDTH_PERCENTAGE: 0.4,
    GRID_MARGIN: 10,

    _init: function (props) {
        this._cards = [];

        props = props || {};
        props.margin = 10;
        this.parent(props);

        this._title_label = new Gtk.Label({
            valign: Gtk.Align.START,
            wrap: true
        });

        this._scroller = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vexpand: true,
            valign: Gtk.Align.FILL
        });

        this._card_list_box = new Gtk.ListBox({
            hexpand: true,
            valign: Gtk.Align.START
        });
        this._scroller.add(this._card_list_box);

        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_TITLE);

        this.add(this._title_label);
        this.add(this._scroller);
        this.show_all();
    },

    add_cards: function (cards) {
        this._cards = cards;
        for (let card of cards) {
            this._card_list_box.add(card);
        }
    },

    remove_cards: function () {
        for (let card of this._cards) {
            this._card_list_box.remove(card);
        }
        this._cards = [];
    },

    set_title: function (title) {

        this._title_label.label = title;
    },

    // FIXME: This is a very gross approximation of the sizing specs
    // while we wait for more detailed instructions
    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let [min, nat] = this._cards_max_preferred_width();

        let scroller_width_pct = this.SCROLLER_WIDTH_PERCENTAGE;
        let [lbl_min_height, lbl_nat_height] = this._title_label.get_preferred_height();

        let label_y = (alloc.height - lbl_nat_height) / 2;

        let label_alloc = new Cairo.RectangleInt({
            x: alloc.x,
            y: label_y,
            width: alloc.width * (1 - scroller_width_pct) - 2 * this.GRID_MARGIN,
            height: lbl_nat_height
        });
        this._title_label.size_allocate(label_alloc);

        let scroller_alloc = new Cairo.RectangleInt({
            x: alloc.width * (1 - scroller_width_pct),
            y: alloc.y,
            width: alloc.width * scroller_width_pct - 2 * this.GRID_MARGIN,
            height: alloc.height
        });
        this._scroller.size_allocate(scroller_alloc);
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this._cards_max_preferred_width();
        min = min * (2 - this.SCROLLER_WIDTH_PERCENTAGE);
        min = min < this.MINIMUM_WIDTH ? this.MINIMUM_WIDTH : min;
        nat = nat < min ? min : nat;
        return [min, nat];
    },

    vfunc_get_preferred_height: function () {
        let min = 0, nat = 0;
        for (let card of this._cards) {
            let [card_min, card_nat] = card.get_preferred_height();
            min = Math.max(min, card_min);
            nat = Math.max(nat, card_nat);
        }
        return [min, nat];
    },

    _cards_max_preferred_width: function () {
        let min = 0, nat = 0;
        for (let card of this._cards) {
            let [card_min, card_nat] = card.get_preferred_width();
            min = Math.max(min, card_min);
            nat = Math.max(nat, card_nat);
        }
        return [min, nat];
    }
});
