// Copyright 2015 Endless Mobile, Inc.

/* exported ThematicModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Scrollable = imports.app.interfaces.scrollable;

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
const ThematicModule = new Module.Class({
    Name: 'ThematicModule',
    GTypeName: 'EknThematicModule',
    CssName: 'EknThematicModule',
    Extends: Gtk.Grid,
    Implements: [Scrollable.Scrollable],

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);
        this._arrangements = [];
        this._featured_arrangements = [];
        this._non_featured_arrangements = [];
        this._sets = [];

        this.scrollable_init();

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
        return ['arrangement', 'header-card-type'];
    },

    show_more_content: function () {
        if (this._current_index >= this._current_arrangements.length)
            return;
        let arrangement = this._current_arrangements[this._current_index];
        this._current_index += 1;
        let query = new QueryObject.QueryObject({
            limit: -1,
            tags: this._current_model.child_tags.concat(arrangement.accepted_child_tags),
            tag_match: QueryObject.QueryObjectTagMatch.ALL,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, task) => {
            let results;
            try {
                [results] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                logError(e, 'Failed to load objects from set');
                return;
            }

            // If we got no results for this arrangement, move onto the next one
            if (results.length === 0) {
                this.show_more_content();
            } else {
                this._arrangement_update_functions.push(() => { this._pack_arrangement(arrangement, results); });
                this._update_arrangements();
            }
        });
    },

    _pack_arrangement: function (arrangement, models) {
        models.forEach(arrangement.add_model, arrangement);
        arrangement.visible = true;
        Dispatcher.get_default().dispatch({
            action_type: Actions.CONTENT_ADDED,
            scroll_server: this.scroll_server,
        });
    },

    _update_arrangements: function () {
        if (this._ui_frozen)
            return;
        this._arrangement_update_functions.map(fn => fn());
        this._arrangement_update_functions = [];
    },

    _show_set: function (model) {
        this._clear_items();

        this._current_arrangements = model.featured ?
            this._non_featured_arrangements : this._featured_arrangements;
        this._current_index = 0;
        this._current_model = model;
        this.show_more_content();

        Dispatcher.get_default().dispatch({
            action_type: Actions.SET_READY,
            model: model,
        });
    },

    _create_set_card: function (model) {
        let card = this.create_submodule('header-card-type', {
            model: model,
            visible: true,
            halign: Gtk.Align.START,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
                context: this._sets,
            });
        });
        return card;
    },

    _add_set: function (model) {
        this._sets.push(model);
        let header = this._create_set_card(model);

        let separator = new Gtk.Separator({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
        });

        let arrangement = this.create_submodule('arrangement', {
            vexpand: true,
            visible: false,
            no_show_all: true,
        });
        arrangement.accepted_child_tags = model.child_tags.slice();
        arrangement.set_title = model.title;
        arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
                context_label: arrangement.set_title,
            });
        });
        this._arrangements.push(arrangement);

        if (model.featured) {
            this._featured_arrangements.push(arrangement);
        } else {
            this._non_featured_arrangements.push(arrangement);
        }

        let set_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            no_show_all: true,
        });
        set_grid.add(header);
        set_grid.add(separator);
        set_grid.add(arrangement);

        this.add(set_grid);

        arrangement.bind_property('visible', set_grid, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
    },

    _clear_all: function () {
        this.get_children().forEach(this.remove, this);
        this._arrangements = [];
        this._featured_arrangements = [];
        this._non_featured_arrangements = [];
        this._arrangement_update_functions = [];
        this._sets = [];
    },

    _clear_items: function () {
        // Only arrangements that have cards in them should be shown
        this._arrangements.forEach(arrangement => {
            arrangement.clear();
            arrangement.hide();
        });
    },
});
