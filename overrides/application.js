const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SearchProvider = imports.searchProvider.SearchProvider;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Application
 * Common application class for various templates and knowledge apps
 *
 * This class contains various shared functionality for knowledge apps.
 * If you are creating an app using the knowledge engine and it does not fit one
 * of the existing classes such as <KnowledgeApp> or <Reader.Application>, then
 * you should probably inherit from this class.
 *
 * Parent class:
 *   Endless.Application
 */
const Application = new Lang.Class({
    Name: 'Application',
    GTypeName: 'EknApplication',
    Extends: Endless.Application,
    Properties: {
        /**
         * Property: resource-file
         * File handle pointing to the app's GResource
         *
         * You must set this property on construction.
         * An example value would be:
         * > Gio.File.new_for_uri('resource:///com/endlessm/smoke-grinder')
         *
         * Flags:
         *   construct only
         */
        'resource-file': GObject.ParamSpec.object('resource-file',
            'Resource file', 'File handle pointing to the app GResource',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
            /* FIXME: The above should be Gio.File.$gtype; properties with an
            interface type are broken until GJS 1.42 */
        /**
         * Property: css-file
         * File handle pointing to the app's general CSS file
         *
         * You must set this property on construction.
         * However, the usual way to do so is to set it in the constructor of a
         * subclass.
         * This is a Gio.File that should point to the CSS file containing
         * the styling for this application type.
         * (This is augmented if your <resource-file> contains a file called
         * overrides.css.)
         *
         * Flags:
         *   construct only
         */
        'css-file': GObject.ParamSpec.object('css-file', 'CSS file',
            'File handle pointing to the general CSS file',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
            /* FIXME: The above should be Gio.File.$gtype; properties with an
            interface type are broken until GJS 1.42 */
    },

    _init: function (props) {
        this.parent(props);

        this.search_provider = new SearchProvider();
    },

    vfunc_dbus_register: function(connection, path) {
        this.parent(connection, path);
        this.search_provider.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function(connection, path) {
        this.parent(connection, path);
        this.search_provider.unexport(connection, path);
    },

    vfunc_activate: function () {
        let provider = new Gtk.CssProvider();
        provider.load_from_file(this.css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let overrides_css_file = this.resource_file.get_child('overrides.css');
        let overrides_provider = new Gtk.CssProvider();
        overrides_provider.load_from_file(overrides_css_file);
        // Add overrides with one step higher priority than the default
        // knowledge app CSS
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            overrides_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1);
    },
});
