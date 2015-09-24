// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Launcher = imports.app.launcher;
const MeshInteraction = imports.app.modules.meshInteraction;
const QueryObject = imports.search.queryObject;

String.prototype.format = Format.format;

const EncyclopediaPresenter = new Lang.Class({
    Name: 'EncyclopediaPresenter',
    Extends: MeshInteraction.MeshInteraction,
    Implements: [ Launcher.Launcher ],

    _init: function(props) {
        this.parent(props);

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_encyclopedia.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_TEXT_ENTERED:
                    this.do_search(payload.text);
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                    this.load_uri(payload.model.ekn_id, true);
                    break;
                case Actions.SEARCH_CLICKED:
                    this.load_model(payload.model);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.load_uri(payload.ekn_id);
                    break;
            }
        });

        this.history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));
        this.view.connect('key-press-event', this._on_key_press_event.bind(this));
    },

    _do_search_in_view: function (item) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: item.query,
        });

        if (this.view.get_visible_page() !== this.view.search_results_page)
            this.view.show_page(this.view.search_results_page);
        this.view.set_focus_child(null);
        let query_obj = new QueryObject.QueryObject({
            query: item.query,
        });
        this.engine.get_objects_by_query(query_obj, null, (engine, task) => {
            let results, get_more_results_query;
            let dispatcher = Dispatcher.get_default();

            dispatcher.dispatch({
                action_type: Actions.CLEAR_SEARCH,
            });

            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: item.query,
                    error: error,
                });
                return;
            }

            if (results.length === 0)
                item.empty = true;

            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
            });
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
        });
    },

    _on_key_press_event: function (widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        let dispatcher = Dispatcher.get_default();
        if (keyval === Gdk.KEY_Escape) {
            dispatcher.dispatch({
                action_type: Actions.HIDE_ARTICLE_SEARCH,
            });
        } else if (((state & Gdk.ModifierType.CONTROL_MASK) !== 0) &&
                    keyval === Gdk.KEY_f) {
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE_SEARCH,
            });
        }
    },

    _on_history_item_change: function (presenter, item) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: item.query,
        });
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
        switch (item.page_type) {
        case this.ARTICLE_PAGE:
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE,
                model: item.model,
                animation_type: EosKnowledgePrivate.LoadingAnimation.NONE,
            });
            this.view.show_page(this.view.article_page);
            return;
        case this.SEARCH_RESULTS_PAGE:
            this._do_search_in_view(item);
            return;
        }
    },
});
