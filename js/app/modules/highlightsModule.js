// Copyright 2015 Endless Mobile, Inc.

/* exported HighlightsModule */

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: HighlightsModule
 * Module for showing featured articles as well as other sets
 *
 * This module shows a few arrangements and cards consecutively.
 * We recommend placing it in a <ScrollingTemplate> or another module that can
 * allow it to scroll.
 * The top arrangement shows an assortment of cards from all sets.
 * Each subsequent card, or "support card," shows one other set.
 * Clicking on a support card shows you more information about that set.
 * Normally a card type would be chosen for these support cards that displays
 * other cards inside it, such as <SetPreviewCard>.
 * This card type must support a <SetPreviewCard.load_content()> method.
 *
 * Slots:
 *   highlight-arrangement - large arrangement to display highlighted category
 *   support-card-type - type of cards to create for sets
 *   sets-filter - <Filter> for deciding which sets to show
 */
const HighlightsModule = new Lang.Class({
    Name: 'HighlightsModule',
    GTypeName: 'EknHighlightsModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: support-sets
         * The number of support sets to display
         *
         * Flags:
         *   construct-only
         */
        'support-sets': GObject.ParamSpec.uint('support-sets', 'Support Sets',
            'The number of support sets to display',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT16, 0),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this._sets = [];
        this._loaded_sets = 0;
        this._is_feature_item_sent = false;

        this._filter = this.create_submodule('sets-filter');

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.CLEAR_SETS:
                    this._clear_all();
                    break;
                case Actions.APPEND_SETS:
                    let models = payload.models;
                    if (this._filter)
                        models = models.filter(this._filter.include, this._filter);
                    Utils.shuffle(models, models.map(GLib.random_double));
                    // Account for "highlight" set
                    this._sets = models.slice(0, this.support_sets + 1);
                    if (this._sets.length > 0)
                        this._create_highlight_set(this._sets[0]);
                    if (this._sets.length > 1) {
                        this._sets.slice(1).forEach(this._add_set_card, this);
                    }
                    break;
            }
        });

        this._arrangement_update_functions = [];
        this._ui_frozen = false;
        this.connect('hierarchy-changed', () => {
            this.get_toplevel().connect('notify::animating', (toplevel) => {
                this._ui_frozen = toplevel.animating;
                this._update_arrangements();
            });
        });
    },

    // Module override
    get_slot_names: function () {
        return ['highlight-arrangement', 'support-card-type', 'sets-filter'];
    },

    _add_set_card: function (model) {
        let card = this.create_submodule('support-card-type', {
            model: model,
            halign: Gtk.Align.START,
        });
        this.add(card);

        this._arrangement_update_functions.push(() => {
            card.load_content(this._arrangement_loaded.bind(this));
        });
        this._update_arrangements();
    },

    // Load all articles referenced by the shown arrangements in order to
    // populate the arrangements with them. This happens after APPEND_SETS.
    _create_highlight_set: function (set) {
        let arrangement = this.create_submodule('highlight-arrangement', {
            vexpand: true,
            visible: true,
        });
        arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
                context_label: _("Highlights"),
            });
        });
        this.add(arrangement);

        let query = new QueryObject.QueryObject({
            limit: arrangement.get_max_cards(),
            tags: set.child_tags.concat('EknSetObject'),
            tag_match: QueryObject.QueryObjectTagMatch.ALL,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, res) => {
            let models, get_more;
            try {
                [models, get_more] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load articles from database');
                this._arrangement_loaded();
                return;
            }

            this._arrangement_update_functions.push(() => { this._pack_arrangement(arrangement, models); });
            this._update_arrangements();
            this._send_feature_item(arrangement);
            this._send_items_to_filter(arrangement);
        });
    },

    _pack_arrangement: function (arrangement, models) {
        models.forEach(arrangement.add_model, arrangement);
        this._arrangement_loaded();
    },

    _update_arrangements: function () {
        if (this._ui_frozen)
            return;
        this._arrangement_update_functions.map(fn => fn());
        this._arrangement_update_functions = [];
    },

    _arrangement_loaded: function () {
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
        this._arrangement_update_fns = [];
        this._sets = [];
        this._loaded_sets = 0;
        this._is_feature_item_sent = false;
    },

    _send_items_to_filter: function (arrangement) {
        let models_showing = arrangement.get_filtered_models()
            .filter(model => arrangement.get_card_for_model(model) !== null);
        Dispatcher.get_default().dispatch({
            action_type: Actions.FILTER_ITEMS,
            ids: models_showing.map(model => model.ekn_id),
        });
    },

    _send_feature_item: function (arrangement) {
        if (this._is_feature_item_sent)
            return

        let model = arrangement.get_filtered_models()[0];
        if (!model)
            return

        Dispatcher.get_default().dispatch({
            action_type: Actions.FEATURE_ITEM,
            model: model,
        });
        this._is_feature_item_sent = true;
    },
});
