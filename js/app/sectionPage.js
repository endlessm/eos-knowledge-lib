// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const ContentObjectModel = imports.search.contentObjectModel;
const SetBanner = imports.app.setBanner;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

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
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
    },

    Signals: {
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {}
    },

    _init: function (props) {
        this._title = null;

        this.parent(props);
    },

    pack_title_banner: function (title_banner) {
        this.add(title_banner);
    },

    set title (v) {
        if (this._title === v)
            return;
        this._title = v;
        this._title_banner = this._create_title_banner();
        this.pack_title_banner(this._title_banner);
        this.show_all();
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    },

    _create_title_banner: function () {
        let section_model = new ContentObjectModel.ContentObjectModel({
            title: this._title,
            featured: false,
        });
        let banner = new SetBanner.SetBanner({
            model: section_model,
        });
        return banner;
    },
});
