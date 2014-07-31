// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const InfiniteScrolledWindow = imports.infiniteScrolledWindow;

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

    Signals: {
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {}
    },

    _init: function (props) {
        this._title_label = new Gtk.Label({
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
        });

        this._title = null;

        this.parent(props);

        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_TITLE);
        this._scroller = new InfiniteScrolledWindow.InfiniteScrolledWindow();
        this._scroller.connect('notify::need-more-content', Lang.bind(this, function () {
            if (this._scroller.need_more_content) {
                this.emit('load-more-results');
            }
        }))
        this.pack_title_label(this._title_label, this._scroller);
        this.show_all();
    },

    pack_title_label: function (title_label, scrolled_window) {
        this.add(title_label);
        this.add(scrolled_window);
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this._title_label.label = this._title;
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    }
});
