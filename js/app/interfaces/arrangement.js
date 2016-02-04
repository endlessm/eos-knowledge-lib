// Copyright 2015 Endless Mobile, Inc.

/* exported Arrangement */

const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Interface: Arrangement
 * Arrangement and order of cards in a container
 *
 * An arrangement controls how a group of cards are presented in the UI.
 * Examples of arrangements: a list, a grid, etc.
 *
 * Arrangements provide a slot named **card-type** which controls how the card
 * models are converted into cards.
 */
const Arrangement = new Lang.Interface({
    Name: 'Arrangement',
    GTypeName: 'EknArrangement',
    Requires: [ Gtk.Container, Module.Module ],

    Properties: {
        /**
         * Property: all-visible
         * Whether all children are visible or some were cut off
         *
         * Flags:
         *   read-only
         */
        'all-visible': GObject.ParamSpec.boolean('all-visible', 'All visible',
            'All children visible',
            GObject.ParamFlags.READABLE,
            true),
        /**
         * Property: spacing
         * The amount of space in pixels between cards
         *
         * Default:
         *   0
         */
        'spacing': GObject.ParamSpec.uint('spacing', 'Spacing',
            'The amount of space in pixels between cards',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT16, 0),
    },

    _cards_by_id: function () {
        if (!this._cards_by_id_map)
            this._cards_by_id_map = new Map();
        return this._cards_by_id_map;
    },

    _models_by_id: function () {
        if (!this._models_by_id_map)
            this._models_by_id_map = new Map();
        return this._models_by_id_map;
    },

    /**
     * Method: add_model
     * Add a card model to the arrangement
     *
     * Note that adding a card directly with *Gtk.Container.add()* or one of its
     * more specialized relatives will not add a model to the arrangement.
     *
     * Parameters:
     *   model - a <ContentObjectModel>
     *
     * Returns:
     *   the <Card> created for the model, for convenience in connecting signals
     */
    add_model: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        this._cards_by_id().set(model.ekn_id, card);
        this._models_by_id().set(model.ekn_id, model);
        this.pack_card(card);
        return card;
    },

    /**
     * Method: remove_model
     * Remove a card model from the arrangement
     *
     * Note that removing a card directly with *Gtk.Container.remove()* will
     * not remove the model from the arrangement.
     *
     * Parameters:
     *   model - a <ContentObjectModel>
     *
     * Returns:
     *   the <Card> removed from the container, for convenience
     */
    remove_model: function (model) {
        let card = this._cards_by_id().get(model.ekn_id);
        this._cards_by_id().delete(model.ekn_id);
        this._models_by_id().delete(model.ekn_id);
        this.unpack_card(card);
        return card;
    },

    /**
     * Method: get_models
     * Get all card models in the arrangement
     */
    get_models: function () {
        return [...this._models_by_id().values()];
    },

    /**
     * Method: get_card_for_model
     * Get the created <Card> for a card model
     *
     * Parameters:
     *   model - a <ContentObjectModel>
     *
     * Returns:
     *   A <Card> whose <Card.model> property is @model, or **undefined** if
     *   there is none
     */
    get_card_for_model: function (model) {
        return this._cards_by_id().get(model.ekn_id);
    },

    get_max_cards: function () {
        return -1;
    },

    // Module override
    // If you want to override this again in your implementation, do like so:
    //
    // return Arrangement.get_slot_names(this).concat(['more', 'slots']);
    get_slot_names: function () {
        return ['card-type'];
    },

    /**
     * Method: clear
     * Remove all cards from the arrangement
     */
    clear: function () {
        for (let card of this._cards_by_id().values())
            this.unpack_card(card);
        this._cards_by_id().clear();
        this._models_by_id().clear();
    },

    highlight: function (highlight_model) {
        this.clear_highlight();
        for (let model of this.get_models()) {
            if (model.ekn_id === highlight_model.ekn_id) {
                let card = this.get_card_for_model(model);
                card.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
                return;
            }
        }
    },

    clear_highlight: function() {
        for (let card of this._cards_by_id().values()) {
            card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
        }
    },

    /**
     * Method: pack_card
     * Private method intended to be used from implementations
     *
     * Override this method if your container needs anything more complicated
     * than just Gtk.Container.add().
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    pack_card: function (card) {
        this.add(card);
    },

    /**
     * Method: unpack_card
     * Private method intended to be used from implementations
     *
     * Override this method if your container needs anything more complicated
     * than just Gtk.Container.remove().
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    unpack_card: function (card) {
        this.remove(card);
    },

    place_card: function (card, x, y, width, height) {
        let card_alloc = new Gdk.Rectangle({
            x: x,
            y: y,
            width: width,
            height: height,
        });
        card.size_allocate(card_alloc);
        card.set_child_visible(true);
    },
});

function get_spare_pixels_for_card_index (spare_pixels, cards_per_row, idx) {
    if (spare_pixels === 0)
        return 0;

    // All gutters need an extra pixel
    if (spare_pixels === cards_per_row - 1)
        return 1;

    let column = idx % cards_per_row;
    let num_gutters = cards_per_row - 1;

    // Assign a spare pixel to the center gutter if that helps keep things symmetric
    if (num_gutters % 2 === 1 && spare_pixels % 2 === 1) {
        if (column === (num_gutters - 1) / 2)
            return 1;
        spare_pixels--;
    }
    // Assign remaining spare pixels to alternating columns on either side
    if (column < Math.ceil(spare_pixels / 2))
        return 1;
    if (column >= num_gutters - Math.floor(spare_pixels / 2))
        return 1;
    return 0;
}

function get_size_with_spacing (size, count, spacing) {
    return size * count + spacing * (count - 1);
}
