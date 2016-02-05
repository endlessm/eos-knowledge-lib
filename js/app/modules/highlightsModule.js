// Copyright 2015 Endless Mobile, Inc.

/* exported HighlightsModule */

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const CardContainer = imports.app.interfaces.cardContainer;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: HighlightsModule
 * Module for showing featured articles as well as themes
 *
 * This module is designed for apps that have both featured and non-featured
 * sets, where the non-featured sets act as "themes" which unite articles across
 * the featured sets.
 *
 * This module shows a few arrangements consecutively.
 * We recommend placing it in a <ScrollingTemplate> or another module that can
 * allow it to scroll.
 * The top arrangement shows an assortment of cards from all sets.
 * Each subsequent arrangement shows the highlights of one non-featured
 * (thematic) set.
 * Clicking on a card in the arrangement takes you directly to that article.
 * Above each arrangement is a card ("header") showing the title of the set
 * which can also be clicked to show more information about that set.
 *
 * Slots:
 *   large-arrangement - large arrangement to display cards in
 *   small-arrangement - smaller arrangement to display cards in
 *   card-type - type of cards to create for articles
 *   header-card-type - type of cards to create for sets
 *   large-card-type - type of cards to create in the lower large-arrangement
 */
const HighlightsModule = new Lang.Class({
    Name: 'HighlightsModule',
    GTypeName: 'EknHighlightsModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, CardContainer.CardContainer ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    // Overridable in tests
    RESULTS_BATCH_SIZE: 15,

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this._sets = [];
        this._loaded_sets = 0;

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.CLEAR_SETS:
                    this._clear_all();
                    break;
                case Actions.APPEND_SETS:
                    let models = payload.models.filter(model => !model.featured);
                    Utils.shuffle(models, models.map(GLib.random_double));
                    this._sets = models.slice(0, 3);
                    if (this._sets.length > 0)
                        this._create_set(this._sets[0], 'large-arrangement', 'card-type', false);
                    if (this._sets.length > 1)
                        this._create_set(this._sets[1], 'small-arrangement', 'card-type', true);
                    if (this._sets.length > 2)
                        this._create_set(this._sets[2], 'large-arrangement', 'large-card-type', true);
                    this._send_sets_to_filter();
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['large-arrangement', 'small-arrangement', 'header-card-type'];
    },

    _add_set_card: function (model) {
        let card = this.create_submodule('header-card-type', {
            model: model,
            halign: Gtk.Align.START,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
                context: this._sets,
            });
        });
        this.add(card);
    },

    _add_article_card: function (model, card_slot, arrangement) {
        let card = arrangement.add_model(model);
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
                context_label: _("Highlights"),
            });
        });
    },

    // Load all articles referenced by the shown arrangements in order to
    // populate the arrangements with them. This happens after APPEND_SETS.
    _create_set: function (set, arrangement_slot, card_slot, add_header) {
        if (add_header) {
            this._add_set_card(set);

            let separator = new ThemeableImage.ThemeableImage({
                visible: true,
                halign: Gtk.Align.FILL,
                valign: Gtk.Align.CENTER,
            });
            separator.get_style_context().add_class(Gtk.STYLE_CLASS_SEPARATOR);
            this.add(separator);
        }


        let arrangement = this.create_submodule(arrangement_slot, {
            vexpand: true,
            visible: true,
        });
        this.add(arrangement);

        let query = new QueryObject.QueryObject({
            limit: arrangement.get_max_cards(),
            tags: set.child_tags,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, res) => {
            let models, get_more;
            try {
                [models, get_more] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load articles from database');
                this._finish_load();
                return;
            }

            models.forEach(model => this._add_article_card(model, card_slot, arrangement));
            this._finish_load();
        });
    },

    _finish_load: function () {
        this._loaded_sets++;
        if (this._loaded_sets < this._sets.length)
            return;
        Dispatcher.get_default().dispatch({
             action_type: Actions.MODULE_READY,
             module: this,
         });
    },

    _clear_all: function () {
        this.get_children().forEach(this.remove, this);
        this._sets = [];
        this._loaded_sets = 0;
    },

    _send_sets_to_filter: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.FILTER_SETS,
            sets: this._sets.map(set => set.ekn_id),
        });
    },
});
