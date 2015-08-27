// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;

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
    },

    Signals: {
        'article-selected': {
            param_types: [ ContentObjectModel.ContentObjectModel ],
        },
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {},
    },

    _init: function (props) {
        this._model = null;

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
        this._update_banner();
    },

    _update_banner: function () {
        this._title_banner = this.factory.create_named_module('results-title-card', {
            model: this._model,
        });
        this.pack_title_banner(this._title_banner);
        this._title_banner.show_all();
        this.notify('model');
    },
});
