// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        props.valign = Gtk.Align.FILL;

        this.parent(props);

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_A);

        this._banner_module = this.factory.create_named_module('set-banner-module', {
            halign: Gtk.Align.CENTER,
        });
        this._item_group = this.factory.create_named_module('item-group');
        this._separator = new Gtk.Separator({
            margin_start: 20,
            margin_end: 20,
        });

        this.add(this._banner_module);
        this.add(this._separator);
        this.add(this._item_group);
    },
});
