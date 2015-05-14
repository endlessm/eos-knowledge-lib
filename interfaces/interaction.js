const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

// This is an interface
const Interaction = new Lang.Class({
    Name: 'Interaction',
    Extends: GObject.Object,
    Properties: {
        'page-manager': GObject.ParamSpec.object('page-manager', 'Page manager',
            'Page manager of which to manage the pages',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Endless.PageManager.$gtype),
    },

    PAGE_TYPES: [],

    _init: function (props) {
        this.parent(props);
        this._pages = {};
    },

    add_page: function (type, widget) {
        if (this.PAGE_TYPES.indexOf(type) === -1)
            throw new Error("This interaction doesn't support that type of page");

        if (type in this._pages)
            this.page_manager.remove(this._pages[type]);
        this._pages[type] = widget;
        this.page_manager.add(widget);
    },
});
