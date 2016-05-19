// Copyright 2015 Endless Mobile, Inc.

/* exported Arrangement */

const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Interface: Arrangement
 * Arrangement and order of cards in a container
 *
 * An arrangement controls how a group of cards are presented in the UI.
 * Examples of arrangements: a list, a grid, etc.
 *
 * Slots:
 *   card-type - controls how the card models are converted into cards
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
        /**
         * Property: fade-cards
         * Whether to fade in cards or just show them
         *
         * In some circumstances, arrangements should fade in their cards.
         * For example, in a <SearchModule>, lazily loaded batches of cards
         * beyond the first batch should fade in instead of appearing abruptly.
         *
         * Set this to *true* to make newly added cards fade in, instead of
         * appearing abruptly. The animation's appearance is controlled by the
         * *invisible* and *fade-in* CSS classes on the <Card> widget.
         *
         * You can opt out of this if the arrangement should never fade in
         * its cards, for instance <CarouselArrangement>.
         * In that case, override <Arrangement.fade_card>.
         *
         * Default:
         *   false
         */
        'fade-cards': GObject.ParamSpec.boolean('fade-cards', 'Fade cards',
            'Whether new cards should fade in gradually',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },

    Slots: {
        'card-type': {
            multi: true,
        },
    },

    Signals: {
        /**
         * Signal: card-clicked
         * Emitted when one of the arrangement's cards is clicked
         *
         * Parameters:
         *   model - the <ContentObjectModel> of the card that was clicked
         */
        'card-clicked': {
            param_types: [ ContentObjectModel.ContentObjectModel ],
        },
    },

    _cards_by_id: function () {
        if (!this._cards_by_id_map)
            this._cards_by_id_map = new Map();
        return this._cards_by_id_map;
    },

    _models: function () {
        if (!this._models_array)
            this._models_array = [];
        return this._models_array;
    },

    /**
     * Method: get_count
     * Count the card models in the arrangement
     *
     * This is a method for technical reasons, but it should be treated like a
     * read-only property.
     *
     * Returns:
     *   Number of card models in the arrangement
     */
    get_count: function () {
        return this._models().length;
    },

    _create_card: function (model) {
        let card_props = { model: model };
        if (this._highlight_string)
            card_props.highlight_string = this._highlight_string;
        let card = this.create_submodule('card-type', card_props);
        this._cards_by_id().set(model.ekn_id, card);

        // It's either this or have Card require Gtk.Button, but that would be
        // very bad for DocumentCards.
        if (GObject.signal_lookup('clicked', card.constructor.$gtype) !== 0) {
            card.connect('clicked', card => {
                this.emit('card-clicked', card.model);
            });
        }

        return card;
    },

    /**
     * Method: set_models
     * Display card models in the arrangement
     *
     * Note that adding a card directly with *Gtk.Container.add()* or one of its
     * more specialized relatives will not add a model to the arrangement.
     *
     * Parameters:
     *   models - an array of <ContentObjectModel>s
     */
    set_models: function (models) {
        let max_cards = this.get_max_cards();
        let ix;
        for (ix = 0; ix < models.length; ix++) {
            let model = models[ix];
            let old_model = this._models()[ix];
            let new_id = model.ekn_id;

            if (old_model && old_model.ekn_id === new_id)
                continue;

            // TODO: this should be more intelligent and see if a card is
            // already created but in a different position; but this dumb
            // iteration is enough for the proof of concept

            if (old_model) {
                this._models().splice(ix, 1, model);
                this._remove_card_for_model(old_model);
            } else {
                this._models()[ix] = model;
            }

            if (max_cards > -1 && ix >= max_cards)
                continue;

            let card = this._create_card(model);
            this.pack_card(card);

            if (this.fade_cards)
                this.fade_card_in(card);
            else
                card.show_all();
        }

        for (; ix < this._models().length; ix++)
            this._remove_card_for_model(this._models()[ix]);
        this._models().splice(ix, this._models.length - ix);
    },

    _remove_card_for_model: function (model) {
        let card = this._cards_by_id().get(model.ekn_id);
        if (card) {
            this._cards_by_id().delete(model.ekn_id);
            this.unpack_card(card);
        }
    },

    /**
     * Method: get_models
     * Get all card models in the arrangement
     */
    get_models: function () {
        return this._models().slice();
    },

    /**
     * Method: get_cards
     * Get card models in the arrangement that are to be displayed.
     *
     * This method will return filtered and ordered cards.
     */
    get_cards: function () {
        let models = this.get_models();
        return models.map((model) => this.get_card_for_model(model)).filter((card) => card);
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
     *   no such card exists, either because the arrangement is not displaying
     *   it, or because @model is not in the arrangement
     */
    get_card_for_model: function (model) {
        return this._cards_by_id().get(model.ekn_id);
    },

    get_max_cards: function () {
        return -1;
    },

    /**
     * Method: clear
     * Remove all cards from the arrangement
     */
    clear: function () {
        for (let card of this._cards_by_id().values())
            this.unpack_card(card);
        this._cards_by_id().clear();
        while (this._models().pop())
            ;
    },

    highlight: function (highlight_model) {
        this.clear_highlight();
        let card = this.get_card_for_model(highlight_model);
        if (card)
            card.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
    },

    clear_highlight: function() {
        for (let card of this._cards_by_id().values()) {
            card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
        }
    },

    /**
     * Method: highlight_string
     * Highlight occurrences of a string on all the cards
     *
     * This method causes all occurrences of @str to be highlighted on each
     * card that the arrangement is showing, using <Card.highlight-string>.
     *
     * Parameters:
     *   str - a string, or **null** to remove highlights
     */
    highlight_string: function (str) {
        if (this._highlight_string === str)
            return;
        this._highlight_string = str;

        for (let card of this._cards_by_id().values()) {
            let str_to_set = str ? str : '';
            if (card.highlight_string !== str_to_set)
                card.highlight_string = str_to_set;
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

    /**
     * Method: fade_card_in
     * Private method intended to be overridden in implementations
     *
     * Override this method if your container should do something different to
     * fade in a card than simply call <Card.fade_in()> on it.
     * For example, if your container should not fade cards in at all, then
     * override this to call **card.show_all()**.
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    fade_card_in: function (card) {
        card.fade_in();
    },
});

function place_card (card, x, y, width, height) {
    let card_alloc = new Gdk.Rectangle({
        x: x,
        y: y,
        width: width,
        height: height,
    });
    card.size_allocate(card_alloc);
    card.set_child_visible(true);
}

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
