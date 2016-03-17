// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

const RESULTS_SIZE = 4;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SearchBox
 *
 * A search bar for querying information in the knowledge apps.
 */
const SearchBox = new Lang.Class({
    Name: 'SearchBox',
    GTypeName: 'EknSearchBox',
    Extends: Endless.SearchBox,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        if (props.visible === undefined)
            props.visible = true;
        this.parent(props);
        this._autocomplete_models = {};
        this._cancellable = null;
        this._link_action_set = false;
        this.get_style_context().add_class(StyleClasses.SEARCH_BOX);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.SET_SEARCH_TEXT:
                    this.set_text_programmatically(payload.text);
                    break;
                case Actions.FOCUS_SEARCH:
                    if (this.get_mapped()) {
                        this.grab_focus();
                    }
                    break;
            }
        });

        this.connect('changed', () => {
            this._update_link_action();
        });
        this.connect('text-changed', () => {
            this._on_text_changed();
        });
        this.connect('activate', () => {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: this.text,
            });
        });
        this.connect('menu-item-selected', (entry, ekn_id) => {
            let model = this._autocomplete_models.filter((model) => model.ekn_id === ekn_id)[0];
            dispatcher.dispatch({
                action_type: Actions.AUTOCOMPLETE_CLICKED,
                query: this.text,
                model: model,
                context: this._autocomplete_models,
            });
        });
        this.completion.connect('action-activated', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: this.text,
            });
        });
    },

    _on_text_changed: function () {
        if (this._cancellable)
            this._cancellable.cancel();
        this._cancellable = new Gio.Cancellable();

        let query = Utils.sanitize_query(this.text);
        // Ignore empty queries
        if (query.length === 0)
            return;

        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
            tags: ['EknArticleObject'],
        });
        Engine.get_default().get_objects_by_query(query_obj,
                                         this._cancellable,
                                         (engine, task) => {
            this._cancellable = null;
            if (query !== Utils.sanitize_query(this.text))
                return;

            let get_more_results_query;
            try {
                [this._autocomplete_models, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    logError(error);
                return;
            }

            this.set_menu_items(this._autocomplete_models.map((model) => {
                return {
                    title: this._get_prefixed_title(model, this.text),
                    id: model.ekn_id,
                };
            }));
        });
    },

    /*
     * Returns either the title or origin_title of the obj, depending on which
     * one is closer to having query as a prefix. Doesn't use a simple indexOf,
     * because of the fact that query might not be accented, even when titles
     * are.
     */
    _get_prefixed_title: function (model, query) {
        let title = model.title.toLowerCase();
        let original_title = model.original_title.toLowerCase();
        query = query.toLowerCase();

        for (let i = 0; i < query.length; i++) {
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
