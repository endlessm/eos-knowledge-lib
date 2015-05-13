const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Factory = imports.factory;
const Interaction = imports.interfaces.interaction;
const Window = imports.window;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const App = new Lang.Class({
    Name: 'App',
    Extends: Endless.Application,
    Properties: {
        'css-file': GObject.ParamSpec.object('css-file', 'CSS file',
            'File handle to the app-wide CSS',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),  // FIXME: should be Gio.File.$gtype
        // The app needs access to the factory (even though it is created by the
        // factory) because it needs to create more components during "startup".
        // An alternative would be for the factory to connect to the app's
        // "startup" signal and do that work there; so the code would remain
        // inside the factory.
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

        let provider = new Gtk.CssProvider();
        provider.load_from_file(this.css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        this._interaction =
            this.factory.create_interaction(this.window.page_manager);

        // Not sure this belongs here, but it needs to be done after the window
        // is created, in any case
        let pages = this.factory.create_pages();
        Object.keys(pages).forEach((key) => {
            this._interaction.add_page(key, pages[key]);
            let modules = this.factory.create_modules(key);
            Object.keys(modules).forEach((module_key) => {
                pages[key].add_module(module_key, modules[module_key]);
            });
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
