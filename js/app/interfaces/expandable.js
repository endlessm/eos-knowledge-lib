// Copyright 2015 Endless Mobile, Inc.

/* exported Expandable */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Interface: Expandable
 *
 * An expandable interface is implemented by a widget
 * which may have extra content that it does not immediately
 * show on the screen.
 */
const Expandable = new Lang.Interface({
    Name: 'Expandable',
    GTypeName: 'EknExpandable',
    Requires: [ Module.Module ],

    Properties: {
        /**
         * Property: has-more-content
         *
         * A boolean value that stores whether or not this module
         * has more content to show.
         */
        'has-more-content': GObject.ParamSpec.boolean('has-more-content', 'Has more content',
            'True iff the module has more content to show',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),

    },
});
