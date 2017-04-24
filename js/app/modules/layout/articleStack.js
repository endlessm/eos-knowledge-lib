// Copyright 2015 Endless Mobile, Inc.

/* exported ArticleStack */

const Eknc = imports.gi.EosKnowledgeContent;
const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Actions = imports.app.actions;
const Card = imports.app.interfaces.card;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const WebviewTooltipPresenter = imports.app.webviewTooltipPresenter;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const Navigation = {
    PREVIOUS: 'previous',
    NEXT: 'next',
    BOTH: 'both',
    NEITHER: 'neither',
};

/**
 * Class: ArticleStack
 *
 * When the history store changes to display an article, creates a document
 * card, starts an asynchronous load of the document content and transitions
 * in the content when its ready.
 */
const ArticleStack = new Module.Class({
    Name: 'Layout.ArticleStack',
    Extends: Gtk.Stack,

    Properties: {
        /**
         * Property: engine
         * Handle to EOS knowledge engine. For testing only.
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: do-sliding-animation
         * Whether the stack should use a sliding animation or just crossfade.
         *
         * If true, the article stack module will transition new articles in
         * from the left and old from the right. If false, will just crossfade.
         */
        'do-sliding-animation': GObject.ParamSpec.boolean('do-sliding-animation',
            'Do Sliding Animation', 'Do Sliding Animation',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
        /**
         * Property: allow-navigation
         * What direction of navigation to allow.
         *
         * We can either allow 'previous', 'next', 'neither', or 'both' navigation
         * from the current article.
         */
        'allow-navigation': GObject.ParamSpec.string('allow-navigation',
            'Allow navigation', 'What direction of navigation to allow',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Navigation.BOTH),
    },

    Slots: {
        'card': {
            multi: true,
        },
        'nav-card': {
            multi: true,
        },
        'nav-content': {
            multi: true,
        },
        'video': {
            multi: true,
        },
        'audio': {
            multi: true,
        },
    },

    References: {
        'selection': {},  // type: Selection
    },

    CONTENT_TRANSITION_DURATION: 500,

    _init: function (props={}) {
        props.expand = true;
        props.visible = true;
        props.transition_duration = this.CONTENT_TRANSITION_DURATION;
        this.parent(props);

        this._webview_tooltip_presenter = new WebviewTooltipPresenter.WebviewTooltipPresenter();
        this._webview_tooltip_presenter.connect('show-tooltip', this._on_show_tooltip.bind(this));

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));

        this.reference_module('selection', selection => {
            this._selection = selection;
            if (this._selection) {
                this._selection.connect('models-changed', () => {
                    let models = this._selection.get_models();
                    if (models.length > 0)
                        this._load_article_model(models[0]);
                });
            }
        });

        // Clear old views from the stack when its not animating.
        this.connect('notify::transition-running', this._clear_old_views.bind(this));
    },

    _clear_old_views: function () {
        if (this.transition_running)
            return;

        for (let child of this.get_children()) {
            if (child !== this.visible_child) {
                [child.previous_card, child.next_card, child].forEach(this.drop_submodule, this);

                /* FIXME: Calling this.remove(child) does not destroy the widget
                 * probably because we are holding a JS reference to it.
                 * So to avoid having a WebKitWebView leak each time we show a
                 * new article, we destroy the widget explicitly.
                 */
                child.destroy();
            }
        }
    },

    _set_article_content: function (article_content) {
        this.visible_child = article_content;
        article_content.content_view.grab_focus();
        article_content.set_active(true);
        this._clear_old_views();
    },

    _get_transition_type: function () {
        let history = HistoryStore.get_default();
        let direction = history.get_direction();
        let last_index = history.get_current_index();
        last_index += (direction === HistoryStore.Direction.BACKWARDS ? 1 : -1);
        let last_item = history.get_items()[last_index];

        if (!last_item || last_item.page_type !== Pages.ARTICLE)
            return Gtk.StackTransitionType.NONE;
        // Do not animate if transitioning in or out of a lightbox
        let current_item = history.get_current_item();
        if (last_item.media_model && !current_item.media_model ||
            !last_item.media_model && current_item.media_model)
            return Gtk.StackTransitionType.NONE;
        // If not doing sliding animation, direction does not matter
        if (!this.do_sliding_animation)
            return Gtk.StackTransitionType.CROSSFADE;
        if (direction === HistoryStore.Direction.BACKWARDS)
            return Gtk.StackTransitionType.SLIDE_RIGHT;
        return Gtk.StackTransitionType.SLIDE_LEFT;
    },

    _load_article_model: function (model, context) {
        if (this.visible_child &&
            this.visible_child.model.ekn_id === model.ekn_id)
            return;

        let article_content_props = {
            model: model,
        };
        let previous_model, next_model;
        if (context) {
            let index = context.indexOf(model);
            if (index > 0)
                previous_model = context[index - 1];
            if (index < context.length - 1)
                next_model = context[index + 1];
        }
        if (previous_model &&
            (this.allow_navigation === Navigation.PREVIOUS || this.allow_navigation === Navigation.BOTH)) {
            let card = this.create_submodule('nav-card', {
                model: previous_model,
                sequence: Card.Sequence.PREVIOUS,
                navigation_context: _("Previous Article"),
            });
            if (card !== null) {
                article_content_props.previous_card = card;
                card.connect('clicked', () => {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.PREVIOUS_DOCUMENT_CLICKED,
                        model: card.model,
                    });
                });
            }
        }
        if (next_model &&
            (this.allow_navigation === Navigation.NEXT || this.allow_navigation === Navigation.BOTH)) {
            let card = this.create_submodule('nav-card', {
                model: next_model,
                sequence: Card.Sequence.NEXT,
                navigation_context: _("Next Article"),
            });
            if (card !== null) {
                article_content_props.next_card = card;
                card.connect('clicked', () => {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.NEXT_DOCUMENT_CLICKED,
                        model: card.model,
                    });
                });
            }
        }

        if (this.allow_navigation === Navigation.NEXT && !article_content_props.next_card)
            article_content_props.nav_content = this.create_submodule('nav-content');

        let slot = 'card';
        if (model instanceof Eknc.VideoObjectModel) {
            slot = 'video';
        } else if (model instanceof Eknc.AudioObjectModel) {
            slot = 'audio';
        }
        let article_content = this.create_submodule(slot, article_content_props);

        article_content.connect('ekn-link-clicked', (card, ekn_id) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: ekn_id,
            });
        });
        this.transition_type = this._get_transition_type();
        this.add(article_content);
        article_content.show_all();

        article_content.load_content_promise()
        .then(() => {
            if (article_content.get_parent() === null)
                return;
            if (this.transition_type !== Gtk.StackTransitionType.NONE)
                this._set_article_content(article_content);
        })
        .catch(function (error) {
            logError(error);
        });

        // Don't wait for WebKit to signal load-committed if we don't have a
        // loading animation; instead, cut right to the unfinished page
        if (this.transition_type === Gtk.StackTransitionType.NONE)
            this._set_article_content(article_content);
        if (article_content.content_view instanceof WebKit2.WebView)
            this._webview_tooltip_presenter.set_document_card(article_content);
        
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.page_type !== Pages.ARTICLE) {
            this.get_children().forEach((view) => view.set_active(false));
            return;
        }
        this._load_article_model(item.model, item.context);
    },

    _on_show_tooltip: function (tooltip_presenter, tooltip, uri) {
        if (GLib.uri_parse_scheme(uri) === 'ekn') {
            Eknc.Engine.get_default().get_object_promise(uri)
            .then((article_model) => {
                this._webview_tooltip_presenter.show_default_tooltip(tooltip, article_model.title);
            })
            .catch(function (error) {
                logError(error, 'Could not get article model');
            });
        } else if (GLib.uri_parse_scheme(uri) === 'license') {
            // If the URI has the "license://" scheme, then it corresponds to a
            // license file, and we should display it as an external link.
            this._webview_tooltip_presenter.show_license_tooltip(tooltip);
        } else {
            this._webview_tooltip_presenter.show_external_link_tooltip(tooltip, uri);
        }
        return Gdk.EVENT_STOP;
     },
});
