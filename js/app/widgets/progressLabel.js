// Copyright (C) 2014-2016 Endless Mobile, Inc.

const Format = imports.format;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const StyleClasses = imports.app.styleClasses;

String.prototype.format = Format.format;

/**
 * Class: ProgressLabel
 * Widget indicating how much of the magazine issue has been read
 *
 * Extends:
 *   Gtk.Label
 *
 * CSS classes:
 *   progress-label - on the widget
 */
const ProgressLabel = new Knowledge.Class({
    Name: 'ReaderProgressLabel',
    Extends: Gtk.Label,
    Properties: {
        /**
         * Property: current-page
         *
         * The current page number.
         */
        'current-page': GObject.ParamSpec.uint('current-page', 'Current page',
            'Page number currently being displayed',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: total-pages
         *
         * The total number of pages.
         */
        'total-pages': GObject.ParamSpec.uint('total-pages', 'Total pages',
            'Number of pages in total',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0),
    },

    _init: function(props) {
        this._current_page = 0;
        this._total_pages = 0;

        props = props || {};
        props.label = '0 / 0';
        props.use_markup = true;
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.READER_PROGRESS_LABEL);
    },

    get current_page() {
        return this._current_page;
    },

    set current_page(value) {
        this._current_page = value;
        this._update_ui();
    },

    get total_pages() {
        return this._total_pages;
    },

    set total_pages(value) {
        this._total_pages = value;
        this._update_ui();
    },

    _update_ui: function () {
        // The string below may need to be localized if it needs to be displayed
        // differently in some locales; for example, maybe a punctuation mark
        // other than 'slash' would be used.
        this.label = '<span font_weight="heavy">%02d</span> / %d'.format(this._current_page, this._total_pages);
    },
});
