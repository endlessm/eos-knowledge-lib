// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: SectionPage
 *
 * This is an abstract class for the section page of the knowledge apps.
 * It will also be used as the search results page.
 * It has a title and a set of articles to show. Articles are represented
 * by cards.
 *
 */
const SectionPage = new Lang.Class({
    Name: 'SectionPage',
    GTypeName: 'EknSectionPage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         * A string with the title of the section page. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Page Title',
            'Title of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')
    },

    _init: function (props) {
        props = props || {};

        this.title_label = new Gtk.Label();

        this._title = null;

        this.parent(props);

        this.title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_TITLE);
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this.title_label.label = this._title;
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    }
});
