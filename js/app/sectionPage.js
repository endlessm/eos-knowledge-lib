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

    _init: function (props) {
        this._model = null;

        this.parent(props);
    },
});
