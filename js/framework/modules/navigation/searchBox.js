// Copyright 2014 Endless Mobile, Inc.

const {DModel, Gdk, Gio, GObject} = imports.gi;

const Actions = imports.framework.actions;
const Dispatcher = imports.framework.dispatcher;
const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Pages = imports.framework.pages;
const BaseSearchBox = imports.framework.widgets.searchBox;
const Utils = imports.framework.utils;

/**
 * Class: SearchBox
 *
 * A search bar for querying information in the knowledge apps.
 *
 * CSS classes:
 * - autocomplete - on the autocomplete popup (not a child of this module)
 */
var SearchBox = new Module.Class({
    Name: 'Navigation.SearchBox',
    Extends: BaseSearchBox.SearchBox,

    Properties: {
        /**
         * Property: focus-on-map
         * If true, this widget will grab focus when shown on screen.
         */
        'focus-on-map': GObject.ParamSpec.boolean('focus-on-map', 'focus-on-map', 'focus-on-map',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),
    },

    _init: function (props={}) {
        if (props.visible === undefined)
            props.visible = true;
        this.parent(props);
        this._autocomplete_models = {};
        this._cancellable = null;
        this.add_events(Gdk.EventMask.FOCUS_CHANGE_MASK);

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));

        this.connect_after('map', () => {
            if (this.focus_on_map)
                this.grab_focus();
        });
        this.connect('focus-in-event', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_BOX_FOCUSED,
            });
        });
        this.connect('text-changed', () => {
            this._on_text_changed();
        });
        this.connect('activate', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                search_terms: this.text,
            });
        });
        this.connect('menu-item-selected', (entry, id) => {
            let model = this._autocomplete_models.filter(model => model.id === id)[0];
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                search_terms: this.text,
                model: model,
                context: this._autocomplete_models,
            });
        });
        this.connect('more-activated', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                search_terms: this.text,
            });
        });
    },

    _on_history_changed: function () {
        let {page_type, search_terms} = HistoryStore.get_default().get_current_item();
        let search_text = page_type == Pages.SEARCH ? search_terms : '';
        this.set_text_programmatically(search_text);
    },

    _on_text_changed: function () {
        if (this._cancellable)
            this._cancellable.cancel();
        this._cancellable = new Gio.Cancellable();

        let search_terms = Utils.sanitize_search_terms(this.text);
        // Ignore empty queries
        if (search_terms.length === 0)
            return;

        let query_obj = new DModel.Query({
            search_terms,
            limit: BaseSearchBox.MAX_RESULTS + 1,
            tags_match_any: ['EknArticleObject'],
        });
        let engine = DModel.Engine.get_default();
        engine.query(query_obj, this._cancellable)
        .then((results) => {
            if (search_terms !== Utils.sanitize_search_terms(this.text))
                return;

            this._autocomplete_models = results.models;
            this.set_menu_items(this._autocomplete_models.map((model) => {
                return {
                    title: this._get_prefixed_title(model, this.text),
                    id: model.id,
                };
            }));
        })
        .catch(function (error) {
            if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                logError(error);
        });
    },

    /*
     * Returns either the title or origin_title of the obj, depending on which
     * one is closer to having query as a prefix. Doesn't use a simple indexOf,
     * because of the fact that query might not be accented, even when titles
     * are.
     */
    _get_prefixed_title: function (model, query) {
        if (!model.original_title)
            return model.title;

        let title = model.title.toLowerCase();
        let original_title = model.original_title.toLowerCase();
        query = query.toLowerCase();
        let length = Math.min(query.length, title.length, original_title.length);

        for (let i = 0; i < length; i++) {
            if (title[i] !== original_title[i]) {
                if (title[i] === query[i]) {
                    return model.title;
                } else if (original_title[i] === query[i]) {
                    return model.original_title;
                }
            }
        }

        return model.title;
    },
});
