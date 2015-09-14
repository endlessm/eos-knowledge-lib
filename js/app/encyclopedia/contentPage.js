// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const InArticleSearch = imports.app.encyclopedia.inArticleSearch;

const ContentPage = new Lang.Class({
    Name: 'ContentPage',
    Extends: Gtk.Alignment,
    Properties: {
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: search-module
         * <SearchModule> created by this widget
         *
         * FIXME: The dispatcher will make this property unnecessary.
         */
        'search-module': GObject.ParamSpec.object('search-module',
            'Search module', 'Search module for this view',
            GObject.ParamFlags.READABLE, GObject.Object.$gtype),
    },
    Signals: {
        'link-clicked': {
            param_types: [ GObject.TYPE_STRING ],
        },
    },
    // Amount of free horizontal space the webkit content will gobble up
    HORIZONTAL_SPACE_FILL_RATIO: 0.4,

    _init: function(props) {
        props = props || {};
        props.name = 'ContentPage';
        this.parent(props);

        this._search_module = this.factory.create_named_module('search-results');

        this._logo = this.factory.create_named_module('article-app-banner', {
            halign: Gtk.Align.START,
        });

        this._logo.name = 'content_page_logo';

        this._search_box = this.factory.create_named_module('article-search-box');

        // FIXME: this should be on a separate page, instead of all stuffed
        // into a ContentPage
        this._stack = new Gtk.Stack();
        this._stack.get_style_context().add_class('content-stack');
        this._stack.add(this._search_module);

        this._grid = new Gtk.Grid({
            halign: Gtk.Align.FILL,
            hexpand: true,
            column_spacing: 150,
        });
        this._grid.attach(this._logo, 0, 0, 1, 1);
        this._grid.attach(this._search_box, 1, 0, 1, 1);
        this._grid.attach(this._stack, 0, 1, 2, 1);
        this.add(this._grid);
        this.set(0.5, 0.5, this.HORIZONTAL_SPACE_FILL_RATIO, 1.0);

        let mainWindow = this.get_toplevel();
        mainWindow.connect('key-press-event', this._on_key_press_event.bind(this));
    },

    get search_module() {
        return this._search_module;
    },

    load_ekn_content: function (article_model) {
        if (this._search_bar !== undefined) {
            this._search_bar.close();
        }

        let old_document_card = this._document_card;
        this._document_card = this.factory.create_named_module('document-card', {
            model: article_model,
            show_toc: false,
            show_top_title: false,
        });
        this._document_card.load_content(null, (card, task) => {
            try {
                card.load_content_finish(task);
                this._stack.visible_child = card;
                card.content_view.grab_focus();
                if (old_document_card)
                    this._stack.remove(old_document_card);
            } catch (error) {
                logError(error);
            }
        });
        this._document_card.connect('ekn-link-clicked', (card, uri) =>
            this.emit('link-clicked', uri));
        this._document_card.show_all();
        this._stack.add(this._document_card);

        let webview = this._document_card.content_view;
        webview.connect('notify::has-focus', this._on_focus.bind(this));
        webview.connect('enter-fullscreen',
            this._on_fullscreen_change.bind(this, true));
        webview.connect('leave-fullscreen',
            this._on_fullscreen_change.bind(this, false));
    },

    _on_focus: function (webview) {
        let script = "webview_focus = " + webview.has_focus + ";";
        this._run_js_on_loaded_page(webview, script);
    },

    _on_fullscreen_change: function (should_be_fullscreen) {
        this._logo.visible = !should_be_fullscreen;
        this._search_box.visible = !should_be_fullscreen;
        this.xscale = should_be_fullscreen ? 1.0 : this.HORIZONTAL_SPACE_FILL_RATIO;
    },

    // first, if the webview isn't loading something, attempt to run the
    // javascript on the page. Also attach a handler to run the javascript
    // whenever the webview's load-changed indicates it's finished loading
    // something
    _run_js_on_loaded_page: function (webview, script) {
        if (webview.uri !== null && !webview.is_loading) {
            webview.run_javascript(script, null, null);
        }
        let handler = webview.connect('load-changed', (webview, status) => {
            if (status === WebKit2.LoadEvent.FINISHED) {
                webview.run_javascript(script, null, null);
                webview.disconnect(handler);
            }
        });
    },

    show_search: function () {
        this._stack.visible_child = this._search_module;
    },

    _on_key_press_event: function(widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        if (keyval === Gdk.KEY_Escape) {
            if (this._search_bar !== undefined) {
                this._search_bar.close();
            }
        } else if (((state & Gdk.ModifierType.CONTROL_MASK) !== 0) &&
                    keyval === Gdk.KEY_f) {
            if (this._search_bar === undefined &&
                this._document_card !== undefined) {
                this._search_bar = new InArticleSearch.InArticleSearch(this._document_card.content_view);
                this._grid.attach(this._search_bar, 0, 2, 2, 1);
            }

            this._search_bar.open();
        }
    },
});
