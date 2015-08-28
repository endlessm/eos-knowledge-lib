// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
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

    _init: function (props) {
        this._cards = [];

        props.expand = true;
        this.parent(props);

        this._content_grid = new Gtk.Grid();

        this._title_frame = new Gtk.Frame();
        this._title_frame.get_style_context().add_class(StyleClasses.SECTION_PAGE_B_TITLE_FRAME);

        this._content_grid.add(this._title_frame);

        this._item_group = this.factory.create_named_module('item-group');

        this._content_grid.add(this._item_group);

        this.add(this._content_grid);

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
    },

    pack_title_banner: function (title_banner) {
        title_banner.valign = Gtk.Align.END;
        title_banner.max_width_chars = 0;

        let child = this._title_frame.get_child();
        if (child !== null)
            this._title_frame.remove(child);
        this._title_frame.add(title_banner);
    },
});
