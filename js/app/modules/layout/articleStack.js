// Copyright 2015 Endless Mobile, Inc.

/* exported ArticleStack */

const Gettext = imports.gettext;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Actions = imports.app.actions;
const Card = imports.app.interfaces.card;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
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
 * Listens for the show-article action to be dispatched, creates a document
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
    },

    CONTENT_TRANSITION_DURATION: 500,

    _init: function (props={}) {
        props.expand = true;
        props.visible = true;
        props.transition_duration = this.CONTENT_TRANSITION_DURATION;
        this.parent(props);

        this._webview_tooltip_presenter = new WebviewTooltipPresenter.WebviewTooltipPresenter();
        this._webview_tooltip_presenter.connect('show-tooltip', this._on_show_tooltip.bind(this));

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_ARTICLE:
                    this._show_article(payload);
                    break;
            }
        });

        // Clear old views from the stack when its not animating.
        this.connect('notify::transition-running', () => {
            if (!this.transition_running) {
                for (let child of this.get_children()) {
                    if (child !== this.visible_child) {
                        [child.previous_card, child.next_card, child].forEach(this.drop_submodule, this);
                        this.remove(child);
                    }
                }
            }
        });
    },

    _show_article: function (payload) {
        let document_card_props = {
            model: payload.model,
        };
        if (payload.previous_model &&
            (this.allow_navigation === Navigation.PREVIOUS || this.allow_navigation === Navigation.BOTH)) {
            let card = this.create_submodule('nav-card', {
                model: payload.previous_model,
                sequence: Card.Sequence.PREVIOUS,
                navigation_context: _("Previous Article"),
            });
            if (card !== null) {
                document_card_props.previous_card = card;
                card.connect('clicked', () => {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.PREVIOUS_DOCUMENT_CLICKED,
                        model: card.model,
                    });
                });
            }
        }
        if (payload.next_model &&
            (this.allow_navigation === Navigation.NEXT || this.allow_navigation === Navigation.BOTH)) {
            let card = this.create_submodule('nav-card', {
                model: payload.next_model,
                sequence: Card.Sequence.NEXT,
                navigation_context: _("Next Article"),
            });
            if (card !== null) {
                document_card_props.next_card = card;
                card.connect('clicked', () => {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.NEXT_DOCUMENT_CLICKED,
                        model: card.model,
                    });
                });
            }
        }
        let document_card = this.create_submodule('card', document_card_props);

        document_card.connect('ekn-link-clicked', (card, ekn_id) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: ekn_id,
            });
        });

        if (payload.animation_type === EosKnowledgePrivate.LoadingAnimation.FORWARDS_NAVIGATION) {
            if (this.do_sliding_animation)
                this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            else
                this.transition_type = Gtk.StackTransitionType.CROSSFADE;
        } else if (payload.animation_type === EosKnowledgePrivate.LoadingAnimation.BACKWARDS_NAVIGATION) {
            if (this.do_sliding_animation)
                this.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            else
                this.transition_type = Gtk.StackTransitionType.CROSSFADE;
        } else {
            this.transition_type = Gtk.StackTransitionType.NONE;
        }

        this.add(document_card);
        document_card.show_all();

        document_card.load_content(null, (card, task) => {
            try {
                document_card.load_content_finish(task);
                if (document_card.get_parent() === null)
                    return;
                if (payload.animation_type !== EosKnowledgePrivate.LoadingAnimation.NONE) {
                    this.visible_child = document_card;
                    document_card.content_view.grab_focus();
                }
            } catch (error) {
                logError(error);
            }
        });

        // Don't wait for WebKit to signal load-committed if we don't have a
        // loading animation; instead, cut right to the unfinished page
        if (payload.animation_type === EosKnowledgePrivate.LoadingAnimation.NONE) {
            this.visible_child = document_card;
            document_card.content_view.grab_focus();
        }
        if (document_card.content_view instanceof WebKit2.WebView)
            this._webview_tooltip_presenter.set_document_card(document_card);
    },

    _on_show_tooltip: function (tooltip_presenter, tooltip, uri) {
        if (GLib.uri_parse_scheme(uri) === 'ekn') {
            Engine.get_default().get_object_by_id(uri, null, (engine, task) => {
                let article_model;
                try {
                    article_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not get article model');
                    return;
                }
                this._webview_tooltip_presenter.show_default_tooltip(tooltip, article_model.title);
            });
        } else if (GLib.uri_parse_scheme(uri) === 'file' && uri.indexOf('/licenses/') > -1) {
            // If the uri has the "file://" scheme and it includes a segments for "licenses",
            // it corresponds to a license file, and we should display it as an external link.
            this._webview_tooltip_presenter.show_license_tooltip(tooltip);
        } else {
            this._webview_tooltip_presenter.show_external_link_tooltip(tooltip, uri);
        }
        return Gdk.EVENT_STOP;
     },
});
