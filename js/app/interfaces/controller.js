// Copyright 2015 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const SetMap = imports.app.setMap;

const CSS_RESOURCE_PATH = '/com/endlessm/knowledge/data/css/';

/**
 * Interface: Controller
 * Controller for pages in an app.
 *
 * An Controller drives the flow of the application from page to page. It also
 * adds the pages to the app window’s page manager.
 *
 * Slots:
 *   window
 */
const Controller = new Lang.Interface({
    Name: 'Controller',
    GTypeName: 'EknController',
    Requires: [ Module.Module ],

    Properties: {
        /**
         * Property: application
         * The GApplication for the knowledge app
         *
         * This should always be set except for during testing. If this is not
         * set in unit testing, make sure to mock out view object. The real
         * Endless.Window requires a application on construction.
         *
         * Flags:
         *   Construct only
         */
        'application': GObject.ParamSpec.object('application', 'Application',
            'Presenter for article page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: template-type
         * The template type for the Knowledge app.
         *
         * The legacy template type to be used by the Knowledge app. Possible values
         * are "A", "B" and "encyclopedia".
         *
         * Flags:
         *   Construct only
         */
        'template-type': GObject.ParamSpec.string('template-type', 'template-type',
            'Template type of the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: css
         * CSS overrides for the Knowledge app
         *
         * The CSS override declarations specific for the Knowledge app.
         *
         * Flags:
         *   Construct only
         */
        'css': GObject.ParamSpec.string('css', 'css',
            'CSS overrides for the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: theme
         * Theme name of the base CSS specification
         *
         * The theme name of the base CSS specication that is associated with
         * the app design. If the theme name is not provided, it will use the
         * default theme.
         *
         * Flags:
         *   Construct only
         */
        'theme': GObject.ParamSpec.string('theme', 'Theme',
            'Theme name of the base CSS specification',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'default'),
    },

    Slots: {
        'window': {},
    },

    initialize_set_map: function (cb) {
        // Load all sets, with which to populate the set map
        // FIXME: deduplicate this with Selection.AllSets
        Eknc.Engine.get_default().query(Eknc.QueryObject.new_from_props({
            limit: GLib.MAXUINT32,
            tags_match_all: ['EknSetObject'],
        }), null, (engine, res) => {
            let results;
            try {
                results = engine.query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load sets from database');
                return;
            }

            SetMap.init_map_with_models(results.models);

            this._window.make_ready(cb);
        });
    },

    load_theme: function () {
        let provider = new Gtk.CssProvider();
        provider.load_from_resource(CSS_RESOURCE_PATH + 'keybindings.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        provider = new Gtk.CssProvider();
        if (this.css) {
            provider.load_from_data(this.css);
        } else if (this.theme) {
            provider.load_from_resource(CSS_RESOURCE_PATH + this.theme + '.css');
        } else {
            return;
        }
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },
});
