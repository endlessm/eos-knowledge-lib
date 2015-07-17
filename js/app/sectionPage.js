// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const QueryObject = imports.search.queryObject;

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
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: model
         * Model object for the section
         *
         * A <ContentObjectModel> representing the section displayed on this
         * page.
         */
        'model': GObject.ParamSpec.object('model', 'Model', 'Section model',
            GObject.ParamFlags.READWRITE,
            ContentObjectModel.ContentObjectModel),
        /**
         * Property: query
         * Query object for this page's results
         *
         * FIXME: This property is temporary; in the new system, the search
         * results page will be a different page than the section page.
         */
        'query': GObject.ParamSpec.object('query', 'Query', 'Search query',
            GObject.ParamFlags.READWRITE, QueryObject.QueryObject),
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
        this._model = null;
        this._query = null;

        this.parent(props);
    },

    pack_title_banner: function (title_banner) {
        this.add(title_banner);
    },

    get model() {
        return this._model;
    },

    set model(value) {
        if (this._model === value)
            return;
        this._model = value;
        this._query = null;
        this._update_banner();
    },

    get query() {
        return this._query;
    },

    set query(value) {
        if (this._query === value)
            return;
        this._query = value;
        this._model = null;
        this._update_banner();
    },

    _update_banner: function () {
        this._title_banner = this._create_title_banner();
        this.pack_title_banner(this._title_banner);
        this._title_banner.show_all();
        this.notify('model');
        this.notify('query');
    },

    _create_title_banner: function () {
        if (this._model) {
            return this.factory.create_named_module('results-title-card', {
                model: this._model,
            });
        }
        if (this._query) {
            return this.factory.create_named_module('results-search-banner', {
                query: this._query.query,
            });
        }
        throw new Error("Assert not reached");
    },
});
