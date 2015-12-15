// Copyright 2015 Endless Mobile, Inc.

/* exported Scrollable */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Interface: Scrollable
 *
 * An scrollable interface is implemented by a widget
 * which may have extra content that it does not immediately
 * show on the screen.
 */
const Scrollable = new Lang.Interface({
    Name: 'Scrollable',
    GTypeName: 'EknScrollable',
    Requires: [ Module.Module ],

    /**
     * Method: show_more_content
     * Load more content for this module
     *
     */
    show_more_content: function () {},

});
