// Copyright 2016 Endless Mobile, Inc.

/* exported HierarchicalSetModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Scrollable = imports.app.interfaces.scrollable;
const SetObjectModel = imports.search.setObjectModel;
const ThemeableImage = imports.app.widgets.themeableImage;

const BATCH_SIZE = 15;

/**
 * Class: HierarchicalSetModule
 * Module for showing subsets and articles within a category
 *
 * This module is designed for sets which have subsets within them.
 * Hence it is hierarchical. If subsets exist, this module will show them
 * in a series of arrangements. If this set does not have subsets (and only
 * has articles), those articles will be shown.
 *
 * This module shows a few arrangements consecutively.
 * We recommend placing it in a <ScrollingArrangement> or another module that
 * can allow it to scroll.
 *
 * This module shows articles and subsets from one set. Articles which are
 * direct members of the set are shown at the top. Below that you can find
 * subset cards, each of which will show articles within its subset.
 *
 * Slots:
 *   arrangement - arrangement to display article cards in
 *   card-type - type of cards to create for articles
 *   set-card-type - type of cards to create for sets
 */
const HierarchicalSetModule = new Lang.Class({
    Name: 'HierarchicalSetModule',
    GTypeName: 'EknHierarchicalSetModule',
    CssName: 'EknHierarchicalSetModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Scrollable.Scrollable ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'scroll-server': GObject.ParamSpec.override('scroll-server', Scrollable.Scrollable),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
                context_label: this._current_model.title,
            });
        });
        this.add(this._arrangement);
        this._set_cards = [];
        this._current_model = null;
        this._current_index = -1;
        this._is_feature_item_sent = false;
        this.scrollable_init();

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.SHOW_SET:
                    this._show_set(payload.model);
                    break;
                case Actions.CLEAR_ITEMS:
                    this._clear_items();
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'set-card-type'];
    },

    show_more_content: function () {
        if (this._current_index >= this._set_cards.length) {
            if (this._get_more)
                this._load_content(this._get_more);
            return;
        }
        let set_card = this._set_cards[this._current_index];
        this._current_index += 1;
        set_card.visible = true;
        set_card.load_content();
        Dispatcher.get_default().dispatch({
            action_type: Actions.CONTENT_ADDED,
            scroll_server: this.scroll_server,
        });
    },

    _show_set: function (model) {
        this._clear_items();
        this._current_model = model;
        this._current_index = 0;
        this._is_feature_item_sent = false;

        let query = new QueryObject.QueryObject({
            limit: BATCH_SIZE,
            tags: this._current_model.child_tags,
            tag_match: QueryObject.QueryObjectTagMatch.ALL,
        });

        this._load_content(query);
        Dispatcher.get_default().dispatch({
            action_type: Actions.SET_READY,
            model: model,
        });
    },

    _load_content: function (query) {
        if (this._load_operation_in_progress)
            return;
        Engine.get_default().get_objects_by_query(query, null, (engine, task) => {
            this._load_operation_in_progress = false;
            let results;
            try {
                [results, this._get_more] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                logError(e, 'Failed to load objects from set');
                return;
            }

            if (results.length === 0)
                return;

            let is_loading_sets = true;
            results.forEach((model) => {
                if (model instanceof SetObjectModel.SetObjectModel) {
                    this._add_set_card(model);
                } else if (model instanceof ArticleObjectModel.ArticleObjectModel &&
                    this._belongs_to_current_set_and_not_subset(model)) {
                    this._arrangement.add_model(model);
                    is_loading_sets = false;
                }
            });
            if (is_loading_sets)
                this.show_more_content();
            this._send_feature_item();
            Dispatcher.get_default().dispatch({
                action_type: Actions.CONTENT_ADDED,
                scroll_server: this.scroll_server,
            });
        });
        this._load_operation_in_progress = true;
    },

    _belongs_to_current_set_and_not_subset: function (model) {
        let model_parent_tags = this._current_model.tags
            .filter(tag => !tag.startsWith('Ekn'));
        let tags_in_current_model =
            new Set(this._current_model.child_tags.concat(model_parent_tags));
        let tags_not_in_current_model = model.tags.filter(tag =>
            !tag.startsWith('Ekn') && !tags_in_current_model.has(tag));
        return (tags_not_in_current_model.length === 0);
    },

    _add_set_card: function (model) {
        let card = this.create_submodule('set-card-type', {
            model: model,
            no_show_all: true,
        });
        this._set_cards.push(card);
        let separator = new ThemeableImage.ThemeableImage({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
        });
        separator.get_style_context().add_class(Gtk.STYLE_CLASS_SEPARATOR);
        this.add(separator);
        this.add(card);
    },

    _clear_items: function () {
        this._arrangement.clear();
        this._set_cards.forEach(this.remove, this);
        this._set_cards = [];
        this._get_more = null;
    },

    _send_feature_item: function () {
        if (this._is_feature_item_sent)
            return;

        let model;
        if (this._arrangement.get_card_count()) {
            model = this._arrangement.get_filtered_models()[0];
        } else {
            model = this._current_model;
        }

        if (!model)
            return;

        Dispatcher.get_default().dispatch({
            action_type: Actions.FEATURE_ITEM,
            model: model,
        });
        this._is_feature_item_sent = true;
    },
});
