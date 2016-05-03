// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Launcher = imports.app.interfaces.launcher;
const Module = imports.app.interfaces.module;


// # Interface: Interaction
// Interaction for pages in an app.
//
// An Interaction drives the flow of the application from page to page. It also
// adds the pages to the app window’s page manager.
//
// ## Slots:
// window
const Interaction = new Lang.Interface({
    Name: 'Interaction',
    GTypeName: 'EknInteraction',
    Requires: [ Module.Module, Launcher.Launcher ],

    Properties: {
         // ## Property: application
         // The GApplication for the knowledge app
         //
         // This should always be set except for during testing. If this is not
         // set in unit testing, make sure to mock out view object. The real
         // Endless.Window requires a application on construction.
         //
         // ### Flags:
         //   Construct only
        'application': GObject.ParamSpec.object('application', 'Application',
            'Presenter for article page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        // ## Property: template-type
        // The template type for the Knowledge app.
        //
        // The legacy template type to be used by the Knowledge app. Possible values
        // are "A", "B" and "encyclopedia".
        //
        // ### Flags:
        //   Construct only
        'template-type': GObject.ParamSpec.string('template-type', 'template-type',
            'Template type of the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        // ## Property: css
        // CSS overrides for the Knowledge app
        //
        // The CSS override declarations specific for the Knowledge app.
        //
        // ### Flags:
        //   Construct only
        'css': GObject.ParamSpec.string('css', 'css',
            'CSS overrides for the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    Slots: {
        'window': {},
    },
});
