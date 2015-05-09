const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Factory = imports.factory;
const Interaction = imports.interfaces.interaction;
const Window = imports.window;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const App = new Lang.Class({
    Name: 'App',
    Extends: Endless.Application,
    Properties: {
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Factory.Factory),
        'interaction': GObject.ParamSpec.object('interaction', 'Interaction',
            'Interaction model or presenter or whatever',
            GObject.ParamFlags.READABLE,
            Interaction.Interaction),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    vfunc_startup: function () {
        this.parent();

        this.window = new Window.Window({
            application: this,
            title: this.factory.title,
        });

        this._interaction =
            this.factory.create_interaction(this.window.page_manager);

        // Not sure this belongs here, but it needs to be done after the window
        // is created, in any case
        let pages = this.factory.create_pages();
        Object.keys(pages).forEach((key) => {
            this._interaction.add_page(key, pages[key]);
        });
    },

    vfunc_activate: function () {
        this.parent();
        this.window.show_all();
    },

    get interaction() {
        return this._interaction;
    },
});
