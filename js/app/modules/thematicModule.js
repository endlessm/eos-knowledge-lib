// Copyright 2015 Endless Mobile, Inc.

/* exported ThematicModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;

/**
 * Class: ThematicModule
 * Module for showing themes from one main category
 *
 * This module is designed for apps that have both featured and non-featured
 * sets, where the non-featured sets act as "themes" which unite articles across
 * the featured sets.
 *
 * This module shows a few arrangements consecutively.
 * We recommend placing it in a <ScrollingArrangement> or another module that
 * can allow it to scroll.
 *
 * In contrast to the <HighlightsModule> this module shows articles from one
 * set, subdivided into several arrangements.
 * Each arrangement shows either one theme from the selected featured set,
 * or one featured set that has cards from the selected theme.
 *
 * Clicking on a card in the arrangement takes you directly to that article.
 * Above each arrangement is a card ("header") showing the title of the set
 * which can also be clicked to show more information about that set.
 *
 * Slots:
 *   arrangement - arrangement to display cards in
 *   card-type - type of cards to create for articles
 *   header-card-type - type of cards to create for sets
 */
const ThematicModule = new Lang.Class({
    Name: 'ThematicModule',
    GTypeName: 'EknThematicModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);
        this._arrangements = [];
        this._featured_arrangements = [];
        this._non_featured_arrangements = [];
        this._headers_by_arrangement = {};

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.SHOW_SET:
                    this._show_set(payload.model);
                    break;
                case Actions.CLEAR_SETS:
                    this._clear_all();
                    break;
                case Actions.CLEAR_ITEMS:
                    this._clear_items();
                    break;
                case Actions.APPEND_SETS:
                    payload.models.forEach(this._add_set, this);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card-type', 'header-card-type'];
    },

    // Helper method for _show_set()
    _show_non_empty_arrangements: function (arrangements) {
        arrangements.filter(arrangement => arrangement.get_cards().length > 0)
        .forEach(arrangement => {
            arrangement.show_all();
            this._headers_by_arrangement[arrangement].show_all();
        });
    },

    _show_set: function (model) {
        this._clear_items();

        let query = new QueryObject.QueryObject({
            limit: -1,
            tags: model.child_tags,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, task) => {
            let results;
            try {
                [results] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                logError(e, 'Failed to load objects from set');
                return;
            }

            results.forEach(this._add_item, this);

            if (model.featured)
                this._show_non_empty_arrangements(this._non_featured_arrangements);
            else
                this._show_non_empty_arrangements(this._featured_arrangements);

            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_READY,
                model: model,
            });
        });
    },

    _create_set_card: function (model) {
        let card = this.create_submodule('header-card-type', {
            model: model,
            visible: false,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
            });
        });
        return card;
    },

    _create_article_card: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
            });
        });
        return card;
    },

    _add_set: function (model) {
        let header = this._create_set_card(model);
        this.add(header);

        let arrangement = this.create_submodule('arrangement', {
            vexpand: true,
            visible: false,
        });
        arrangement.accepted_child_tags = model.child_tags.slice();
        this.add(arrangement);
        this._arrangements.push(arrangement);
        this._headers_by_arrangement[arrangement] = header;

        if (model.featured) {
            this._featured_arrangements.push(arrangement);
        } else {
            this._non_featured_arrangements.push(arrangement);
        }
    },

    _add_item: function (model) {
        this._arrangements.forEach(arrangement => {
            if (model.tags.some(tag =>
                arrangement.accepted_child_tags.indexOf(tag) > -1)) {
                arrangement.add_card(this._create_article_card(model));
            }
        });
    },

    _clear_all: function () {
        this.get_children().forEach(this.remove, this);
        this._arrangements = [];
        this._featured_arrangements = [];
        this._non_featured_arrangements = [];
        this._headers_by_arrangement = {};
    },

    _clear_items: function () {
        // Only arrangements that have cards in them should be shown
        this._arrangements.forEach(arrangement => {
            arrangement.clear();
            arrangement.hide();
            this._headers_by_arrangement[arrangement].hide();
        });
    },
});
