// Copyright 2014 Endless Mobile, Inc.

const {DModel, Endless, Gdk, Gio, GObject} = imports.gi;
const Gettext = imports.gettext;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const Utils = imports.app.utils;

const RESULTS_SIZE = 4;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SearchBox
 *
 * A search bar for querying information in the knowledge apps.
 */
var SearchBox = new Module.Class({
    Name: 'Navigation.SearchBox',
    Extends: Endless.SearchBox,

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
        this._link_action_set = false;
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
        this.connect('changed', () => {
            this._update_link_action();
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
        this.connect('menu-item-selected', (entry, ekn_id) => {
            let model = this._autocomplete_models.filter((model) => model.ekn_id === ekn_id)[0];
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                search_terms: this.text,
                model: model,
                context: this._autocomplete_models,
            });
        });
        this.completion.connect('action-activated', () => {
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
            limit: RESULTS_SIZE,
            tags_match_any: ['EknArticleObject'],
        });
        let engine = DModel.Engine.get_default();
        this._query_promise = engine.query_promise(query_obj, this._cancellable)
        .then((results) => {
            if (search_terms !== Utils.sanitize_search_terms(this.text))
                return;

            this._autocomplete_models = results.models;
            this.set_menu_items(this._autocomplete_models.map((model) => {
                return {
                    title: this._get_prefixed_title(model, this.text),
                    id: model.ekn_id,
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

    _update_link_action: function () {
        let hide_link = this._list_store.iter_n_children(null) < RESULTS_SIZE;

        if (this._link_action_set && hide_link) {
            this.completion.delete_action(0);
            this._link_action_set = false;
        } else if (!this._link_action_set && !hide_link) {
            this.completion.insert_action_text(0, _("See more results"));
            this._link_action_set = true;
        }
    },
});
