const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const EknWebview = imports.app.eknWebview;

const ARTICLE_SEARCH_BUTTONS_SPACING = 10;
const ARTICLE_SEARCH_MAX_RESULTS = 200;

const ArticleSearch = new Lang.Class({
    Name: 'ArticleSearch',
    Extends: Gtk.Grid,

    _init: function(web_view) {
        this.parent({
            column_spacing: ARTICLE_SEARCH_BUTTONS_SPACING
        });

        this._web_view = web_view;

        this._search_entry = new Gtk.SearchEntry({
            hexpand: true
        });
        this._search_entry.connect('search-changed',
                                   this.search_changed.bind(this));
        this._search_entry.connect('key-press-event',
                                   this.on_key_press_event.bind(this));

        this._next_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-down-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._next_button.connect('clicked', this.search_next.bind(this));

        this._previous_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('go-up-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._previous_button.connect('clicked',
                                      this.search_previous.bind(this));

        this._close_button = new Gtk.Button({
            image: Gtk.Image.new_from_icon_name('window-close-symbolic',
                                                Gtk.IconSize.MENU)
        });
        this._close_button.connect('clicked', this.close.bind(this));

        this.attach(this._search_entry, 0, 0, 1, 1);
        this.attach(this._next_button, 1, 0, 1, 1);
        this.attach(this._previous_button, 2, 0, 1, 1);
        this.attach(this._close_button, 3, 0, 1, 1);
    },

    search_changed: function() {
        this._findController.search(this._search_entry.text,
                                    WebKit2.FindOptions.CASE_INSENSITIVE |
                                    WebKit2.FindOptions.WRAP_AROUND,
                                    ARTICLE_SEARCH_MAX_RESULTS);
    },

    search_next: function() {
        this._findController.search_next();
    },

    search_previous: function() {
        this._findController.search_previous();
    },

    close: function() {
        this.hide();

        this._web_view.grab_focus();
        this._search_entry.set_text("");
        this._findController.search_finish();
    },

    open: function() {
        this.show_all();
        this._search_entry.grab_focus();
        this._findController = this._web_view.get_find_controller();
    },

    on_key_press_event: function(widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        if ((state & Gdk.ModifierType.SHIFT_MASK != 0) &&
             keyval === Gdk.KEY_Return) {
            this.search_previous();
        } else if (keyval === Gdk.KEY_Return) {
            this.search_next();
        }
    }
});

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
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The seach box for this view.',
            GObject.ParamFlags.READABLE,
            Endless.SearchBox),

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

        this._should_emit_link_clicked = true;
        this._search_module = this.factory.create_named_module('search-results');

        this._logo = this.factory.create_named_module('article-app-banner', {
            halign: Gtk.Align.START,
        });

        this._logo.name = 'content_page_logo';

        this.search_box = new Endless.SearchBox();

        // FIXME: this should be on a separate page, instead of all stuffed
        // into a ContentPage
        this._stack = new Gtk.Stack();
        this._stack.add(this._search_module);

        let grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            column_spacing: 150,
        });
        grid.attach(this._logo, 0, 0, 1, 1);
        grid.attach(this.search_box, 1, 0, 1, 1);
        grid.attach(this._stack, 0, 1, 2, 1);
        this.add(grid);
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
        this._document_card.connect('ekn-link-clicked', this._on_link_clicked.bind(this));
        this._should_emit_link_clicked = true;
        this._document_card.show_all();
        this._stack.add(this._document_card);
        this._stack.visible_child = this._document_card;
        this._document_card.content_view.grab_focus();
        if (old_document_card)
            this._stack.remove(old_document_card);
    },

    _on_focus: function () {
        let script = "webview_focus = " + this._wiki_web_view.has_focus + ";";
        this._run_js_on_loaded_page(script);
    },

    _on_fullscreen_change: function (should_be_fullscreen) {
        this._logo.visible = !should_be_fullscreen;
        this.search_box.visible = !should_be_fullscreen;
        this._alignment.xscale = should_be_fullscreen ? 1.0 : this.HORIZONTAL_SPACE_FILL_RATIO;
    },

    // first, if the webview isn't loading something, attempt to run the
    // javascript on the page. Also attach a handler to run the javascript
    // whenever the webview's load-changed indicates it's finished loading
    // something
    _run_js_on_loaded_page: function (script) {
        if (this._wiki_web_view.uri !== null && !this._wiki_web_view.is_loading) {
            this._wiki_web_view.run_javascript(script, null, null);
        }
        let handler = this._wiki_web_view.connect('load-changed', (webview, status) => {
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
                this._search_bar = new ArticleSearch(this._document_card.content_view);
                this._grid.attach(this._search_bar, 0, 2, 2, 1);
            }

            this._search_bar.open();
        }
    },

    _on_decide_policy: function (webview, decision, type) {
        if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
            return false;
        // Don't emit link-clicked if this was due to a programmatic action
        if (!this._should_emit_link_clicked) {
            this._should_emit_link_clicked = true;
            return false; // decision not handled, use default action
        }

        this.emit('link-clicked', decision.request.uri);
        decision.ignore();
        return true;  // decision handled
    },

    _on_link_clicked: function (card, uri) {
        // Don't emit link-clicked if this was due to a programmatic action
        if (!this._should_emit_link_clicked) {
            this._should_emit_link_clicked = true;
            return; // decision not handled, use default action
        }

        this.emit('link-clicked', uri);
    },
});
