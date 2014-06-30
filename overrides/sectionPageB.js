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

        this._cards = null;

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_B);
    },

    pack_title_label: function (title_label) {
        this._widget_container = new SectionPageBWidgetContainer(title_label, this._scroller);
        this.add(this._widget_container);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_list_box.remove(card);
            }
        }
        this._cards = v;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_list_box.add(card);
            }
        }
    },

    get cards () {
        return this._cards;
    },
});

// Private class to handle the special widget container we need on the section page.
// It holds the title label and a scrollable card container.
const SectionPageBWidgetContainer = new Lang.Class({
    Name: 'SectionPageBWidgetContainer',
    GTypeName: 'EknSectionPageBWidgetContainer',
    Extends: Endless.CustomContainer,

    SCROLLER_WIDTH_PERCENTAGE: 0.4,

    _init: function (title_label, scroller, props) {
        this.parent(props);

        this._title_label = title_label;
        this._scroller = scroller;

        this.add(title_label);
        this.add(scroller);
    },

    // FIXME: This is a very gross approximation of the sizing specs
    // while we wait for more detailed instructions
    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let label_alloc = new Cairo.RectangleInt({
            x: alloc.x,
            y: alloc.y,
            width: alloc.width * (1 - this.SCROLLER_WIDTH_PERCENTAGE),
            height: alloc.height
        });
        this._title_label.size_allocate(label_alloc);

        let scroller_alloc = new Cairo.RectangleInt({
            x: label_alloc.x + label_alloc.width,
            y: alloc.y,
            width: alloc.width * this.SCROLLER_WIDTH_PERCENTAGE,
            height: alloc.height
        });
        this._scroller.size_allocate(scroller_alloc);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let [label_min, label_nat] = this._title_label.get_preferred_width();
        let [scroller_min, scroller_nat] = this._scroller.get_preferred_width();
        return [Math.max(scroller_min / this.SCROLLER_WIDTH_PERCENTAGE, label_min / (1 - this.SCROLLER_WIDTH_PERCENTAGE)),
                Math.max(scroller_nat / this.SCROLLER_WIDTH_PERCENTAGE, label_nat / (1 - this.SCROLLER_WIDTH_PERCENTAGE))];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let [label_min, label_nat] = this._title_label.get_preferred_height_for_width(
            width * (1 - this.SCROLLER_WIDTH_PERCENTAGE));
        let [scroller_min, scroller_nat] = this._scroller.get_preferred_height_for_width(
            width * this.SCROLLER_WIDTH_PERCENTAGE);
        return [label_min + scroller_min, label_nat + scroller_nat];
    }
});
