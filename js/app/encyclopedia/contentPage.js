const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const EknWebview = imports.app.eknWebview;
const Layout = imports.app.encyclopedia.layoutPage;

const ARTICLE_SEARCH_BUTTONS_SPACING = 10;
const ARTICLE_SEARCH_MAX_RESULTS = 200;

const _SEARCH_RESULTS_PAGE_URI = 'resource:///com/endlessm/knowledge/html/search_results.html';
const _NO_RESULTS_PAGE_URI = 'resource:///com/endlessm/knowledge/html/no_results.html';
const _ERROR_PAGE_URI = 'resource:///com/endlessm/knowledge/html/error_page.html';

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
    Extends: Layout.EncyclopediaLayoutPage,
    Signals: {
        'display-ready': {},
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
        this._wiki_web_view = new EknWebview.EknWebview({
            expand: true
        });
        this._wiki_web_view.connect("notify::has-focus", this._on_focus.bind(this));
        this._wiki_web_view.connect('decide-policy', this._on_decide_policy.bind(this));
        this._wiki_web_view.connect('load-changed', (view, event) => {
            if (event === WebKit2.LoadEvent.COMMITTED)
                this.emit('display-ready');
        });
        this._wiki_web_view.connect('enter-fullscreen',
            this._on_fullscreen_change.bind(this, true));
        this._wiki_web_view.connect('leave-fullscreen',
            this._on_fullscreen_change.bind(this, false));

        this._logo = new Gtk.Image({
            pixbuf: GdkPixbuf.Pixbuf.new_from_resource_at_scale(
                                                         this._logo_resource,
                                                         150, 150, true),
            halign: Gtk.Align.START
        });
        this._logo.name = 'content_page_logo';

        this._box = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            column_spacing: 150
        });

        this.search_box = new Endless.SearchBox();
        this.search_box.placeholder_text = this.SEARCH_BOX_PLACEHOLDER_TEXT;

        this._box.attach(this._logo, 0, 0, 1, 1);
        this._box.attach(this.search_box, 1, 0, 1, 1);
        this._box.attach(this._wiki_web_view, 0, 1, 2, 1);

        // The aligment allows Gtk.Overlay to take the whole window allocation
        this._alignment = new Gtk.Alignment();
        this._alignment.set(0.5, 0.5, this.HORIZONTAL_SPACE_FILL_RATIO, 1.0);
        this._alignment.add(this._box);
        this.add(this._alignment);
        this.add_overlay(this._disclaimer_icon);

        let mainWindow = this.get_toplevel();
        mainWindow.connect('key-press-event', this._on_key_press_event.bind(this));
    },

    _load_static_html: function (uri) {
        let [success, contents] = Gio.File.new_for_uri(uri).load_contents(null);
        this._should_emit_link_clicked = false;
        this._wiki_web_view.load_html(contents.toString(), uri);
    },

    load_ekn_content: function (uri) {
        if (this._search_bar !== undefined) {
            this._search_bar.close();
        }
        this._should_emit_link_clicked = false;
        this._wiki_web_view.load_uri(uri);
        this._wiki_web_view.has_focus = true;
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

    load_search_result_page: function () {
        this._load_static_html(_SEARCH_RESULTS_PAGE_URI);
        this._wiki_web_view.grab_focus();
    },

    set_search_result_page_searching: function (query) {
        this._run_js_on_loaded_page('setSearchInProgress(' + query.toSource() +
            ');', null, null);
    },

    set_search_result_page_complete: function (query, results) {
        this._wiki_web_view.run_javascript('hideSpinner(); setSearchDone(' +
            query.toSource() + '); clearSearchResults(); ' +
            'appendSearchResults(' + results.toSource() + ');', null, null);
    },

    load_no_results_page: function (query) {
        this._load_static_html(_NO_RESULTS_PAGE_URI);
        this._run_js_on_loaded_page('setQueryString(' + query.toSource() + ');',
            null, null);
        this._wiki_web_view.grab_focus();
    },

    load_error_page: function () {
        this._load_static_html(_ERROR_PAGE_URI);
        this._wiki_web_view.grab_focus();
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
            if (this._search_bar === undefined) {
                this._search_bar = new ArticleSearch(this._wiki_web_view);
                this._box.attach(this._search_bar, 0, 2, 2, 1);
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
});
