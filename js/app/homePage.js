// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: HomePage
 *
 * This represents the abstract class for the home page of the knowledge apps.
 * It has a title image URI and list of article cards to show.
 *
 * To work properly, subclasses will want to implement the 'pack_widgets'
 * and 'pack_cards' methods.
 */
// FIXME: This shouldn't be an interface, but it is temporarily so that we can
// have HomePageB be a module and HomePageA not yet be one.
const HomePage = new Lang.Interface({
    Name: 'HomePage',
    GTypeName: 'EknHomePageTempInterface',
    Requires: [ GObject.Object, Module.Module ],

    Properties: {
        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    Signals: {
        /**
         * Event: show-categories
         * This event is triggered when the categories button is clicked.
         */
        'show-categories': {}
    },

    /**
     * Method: pack_widgets
     *
     * A virtual function to be overridden in subclasses. _init will set up
     * two widgets: title_image and seach_box, and then call into this virtual
     * function.
     *
     * The title_image is a GtkImage, and the search_box is a GtkEntry all
     * connectified for homePage search signals. They can be packed into this
     * widget along with any other widgetry for the subclass in this function.
     */
    pack_widgets: function (title_image, search_box) {
        this.attach(title_image, 0, 0, 3, 1);
        this.attach(search_box, 0, 1, 3, 1);
    },
});
