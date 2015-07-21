const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const SearchBanner = new Lang.Class({
    Name: 'SearchBanner',
    GTypeName: 'EknSearchBanner',
    Extends: Gtk.Label,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'query': GObject.ParamSpec.string('query', 'Query', 'Search query',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/searchBanner.ui',

    _init: function (props={}) {
        this.parent(props);
    },

    get query() {
        return this._query;
    },

    set query(value) {
        if (this._query === value)
            return;
        this._query = value;
        this.label = Utils.page_title_from_query_object(this._query);
    },
});
