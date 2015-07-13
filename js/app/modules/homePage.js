// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: HomePage
 *
 * This represents the abstract class for the home page of the knowledge apps.
 * It has a list of article cards to show.
 *
 * To work properly, subclasses will want to implement the 'pack_cards' method.
 */
const HomePage = new Lang.Class({
    Name: 'HomePage',
    GTypeName: 'EknHomePage',
    Extends: Gtk.Grid,
    Implements: [Module.Module],
    Properties: {
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    _init: function (props={}) {
        this._cards = null;

        this.parent(props);
        this.get_style_context().add_class(StyleClasses.HOME_PAGE);

        this.show_all();
    },

    /**
     * Method: pack_cards
     *
     * A virtual function to be overridden in subclasses. This will be called,
     * whenever the card list changes with a new list of cards to be packed in
     * the module.
     */
    pack_cards: function (cards) {
        // no-op
    },

    set cards (v) {
        if (this._cards === v)
            return;
        this._cards = v;
        if (this._cards === null) {
            this.pack_cards([]);
        } else {
            this.pack_cards(this._cards);
        }
    },

    get cards () {
        return this._cards;
    },
});
