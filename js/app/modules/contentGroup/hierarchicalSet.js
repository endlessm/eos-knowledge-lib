// Copyright 2016 Endless Mobile, Inc.

/* exported HierarchicalSet */

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;

const BATCH_SIZE = 15;

/**
 * Class: HierarchicalSet
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
 *   set-card - type of cards to create for sets
 */
const HierarchicalSet = new Module.Class({
    Name: 'ContentGroup.HierarchicalSet',
    Extends: Gtk.Grid,

    Slots: {
        'arrangement': {},
        'set-card': {
            multi: true,
        },
    },

    References: {
        'scroll-server': {},
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

        this.reference_module('scroll-server', (module) => {
            this._scroll_server_module = module;
            this._scroll_server_module.connect('need-more-content', () => {
                this.show_more_content();
            });
        });

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
        this._scroll_server_module.new_content_added();
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
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
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

            let article_results = results.filter((model) => {
                return (model instanceof ArticleObjectModel.ArticleObjectModel &&
                    this._belongs_to_current_set_and_not_subset(model));
            });
            if (article_results.length > 0) {
                this._arrangement.set_models(article_results);
                is_loading_sets = false;
            }

            results.filter((model) => model instanceof SetObjectModel.SetObjectModel)
                   .forEach((model) => this._add_set_card(model));

            if (is_loading_sets)
                this.show_more_content();
            this._send_feature_item();
            this._scroll_server_module.new_content_added();
        });
        this._load_operation_in_progress = true;
    },

    _belongs_to_current_set_and_not_subset: function (model) {
        let model_parent_tags = this._current_model.tags
            .filter(tag => !tag.startsWith('Ekn'));
        let tags_in_current_model =
            new Set(this._current_model.child_tags.concat(model_parent_tags));
        let tags_not_in_current_model = model.tags.filter(tag =>
            !tag.startsWith('Ekn') && !tags_in_current_model.has(tag) &&
            SetMap.get_set_for_tag(tag));
        return (tags_not_in_current_model.length === 0);
    },

    _add_set_card: function (model) {
        let card = this.create_submodule('set-card', {
            model: model,
            no_show_all: true,
        });
        this._set_cards.push(card);
        let separator = new Gtk.Separator({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
        });
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
            model = this._arrangement.get_models()[0];
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
