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

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.expand = true;
        this.parent(props);

        this._title_frame = new Gtk.Frame();
        this._title_frame.get_style_context().add_class(StyleClasses.SECTION_PAGE_B_TITLE_FRAME);

        this._banner_module = this.factory.create_named_module('set-banner-module', {
            valign: Gtk.Align.END,
        });
        this._item_group = this.factory.create_named_module('item-group');

        this._title_frame.add(this._banner_module);
        this.add(this._title_frame);
        this.add(this._item_group);

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
    },
});
