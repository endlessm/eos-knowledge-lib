const cairo = imports.gi.cairo;  // note: GI module, not native GJS module
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArchiveNotice = imports.app.reader.archiveNotice;
const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const Compat = imports.app.compat.compat;
const Config = imports.app.config;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Launcher = imports.app.launcher;
const LightboxPresenter = imports.app.lightboxPresenter;
const MediaObjectModel = imports.search.mediaObjectModel;
const OverviewPage = imports.app.reader.overviewPage;
const QueryObject = imports.search.queryObject;
const ReaderBackCover = imports.app.modules.readerBackCover;
const ReaderCard = imports.app.modules.readerCard;
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const StyleClasses = imports.app.styleClasses;
const UserSettingsModel = imports.app.reader.userSettingsModel;
const Utils = imports.app.utils;
const WebkitContextSetup = imports.app.webkitContextSetup;
const WebviewTooltip = imports.app.reader.webviewTooltip;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;
const TOTAL_ARTICLES = 30;
const NUM_OVERVIEW_SNIPPETS = 3;

const DATA_RESOURCE_PATH = 'resource:///com/endlessm/knowledge/';

// 1 week in miliseconds
const UPDATE_INTERVAL_MS = 604800000;
const _SEARCH_METRIC = 'a628c936-5d87-434a-a57a-015a0f223838';
const DBUS_WEBVIEW_EXPORT_PATH = '/com/endlessm/webview/';
const DBUS_TOOLTIP_INTERFACE = '\
    <node> \
        <interface name="com.endlessm.Knowledge.TooltipCoordinates"> \
            <method name="GetCoordinates"> \
                <arg name="pointer_coordinates" type="(uu)" direction="in"/> \
                <arg name="dom_element_rectangle" type="(uuuu)" direction="out"/> \
            </method> \
        </interface> \
    </node>';

/**
 * Class: Reader.Presenter
 * Presenter module to manage the reader application
 *
 * Initializes the application from an app.json file given by <app-file>, and
 * manages magazine issues, displaying them in the <view>, and keeping track of
 * which ones have been read.
 */
const Presenter = new Lang.Class({
    Name: 'Presenter',
    GTypeName: 'EknReaderPresenter',
    Extends: GObject.Object,
    Implements: [ Launcher.Launcher ],

    Properties: {
        /**
         * Property: application
         * The GApplication for the knowledge app
         *
         * This should always be set except for during testing. If this is not
         * set in unit testing, make sure to mock out view object. The real
         * Endless.Window requires a application on construction.
         *
         * Flags:
         *   Construct only
         */
        'application': GObject.ParamSpec.object('application', 'Application',
            'Presenter for article page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: engine
         * Handle to EOS knowledge engine
         *
         * Pass an instance of <Engine> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: settings
         * Handles the User Settings
         *
         * Handles the <UserSettingsModel>, which controls things like the
         * last article read and last issue read.
         *
         * Flags:
         *   Construct only
         */
        'settings': GObject.ParamSpec.object('settings', 'User Settings',
            'Handles the User Settings',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: view
         * Reader app view
         *
         * Pass an instance of <Reader.Window> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'view': GObject.ParamSpec.object('view', 'View',
            'Reader app view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: current-page
         *
         * The current article page number.
         *
         * If a standalone page is displaying, then this value is not relevant.
         * A value of 0 represents the overview page, and a value of one beyond
         * the last page represents the done page.
         *
         * Flags:
         *   Read only
         */
        'current-page': GObject.ParamSpec.uint('current-page', 'Current page',
            'Page number currently being displayed',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: history-model
         *
         * The history model for this application.
         *
         * The history model keeps track of which pages have been visited
         * by the user.
         *
         * Flags:
         *   Read only
         */
        'history-model': GObject.ParamSpec.object('history-model', 'History model',
            'The history model for this application',
            GObject.ParamFlags.READABLE,
            GObject.Object.$gtype),
    },

    _NUM_ARTICLE_PAGE_STYLES: 3,

    _init: function (app_json, props) {
        let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_reader.css');
        Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        props.view = props.view || props.factory.create_named_module('window', {
            application: props.application,
        });
        props.engine = props.engine || Engine.Engine.get_default();
        props.settings = props.settings || new UserSettingsModel.UserSettingsModel({
            settings_file: Gio.File.new_for_path(props.application.config_dir.get_path() + '/user_settings.json'),
        });

        this.parent(props);

        // Currently, Reader apps lightboxes don't show an infobox.
        this._lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: this.engine,
            view: this.view,
            factory: this.factory,
        });

        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));
        this._dbus_name = WebkitContextSetup.register_webkit_extensions(this.application.application_id);

        this._article_renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        this._check_for_content_update();

        this._webview_map = {};
        this._article_models = [];

        this.history_model = new EosKnowledgePrivate.HistoryModel();
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: this.history_model,
            history_buttons: this.view.history_buttons,
        });

        this._style_knobs = app_json['styles'];
        this.load_theme();

        this._pending_present_timestamp = null;

        // Connect signals
        this.view.nav_buttons.connect('back-clicked', function () {
            this._add_history_item_for_page(this._current_page - 1);
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            let next_page = (this._current_page + 1) % this.view.total_pages;
            this._add_history_item_for_page(next_page);
        }.bind(this));

        this.view.connect('notify::total-pages',
            this._update_button_visibility.bind(this));

        this.view.issue_nav_buttons.back_button.connect('clicked', function () {
            this.settings.start_article = 0;
            this.settings.bookmark_page = 0;
        }.bind(this));
        this.view.issue_nav_buttons.forward_button.connect('clicked', function () {
            this._update_content();
        }.bind(this));
        this.settings.connect('notify::start-article',
            this._load_new_issue.bind(this));
        let handler = this.view.connect('debug-hotkey-pressed', function () {
            this.view.issue_nav_buttons.show();
            this.view.disconnect(handler);  // One-shot signal handler only.
        }.bind(this));

        this.view.standalone_page.infobar.connect('response', this._open_magazine.bind(this));
        this.view.search_box.connect('activate', (search_entry) => {
            this._on_search(search_entry.text);
        });
        this.view.search_box.connect('text-changed', this._on_search_text_changed.bind(this));
        this.view.search_box.connect('menu-item-selected', this._on_search_menu_item_selected.bind(this));
        this.view.search_results_page.connect('load-more-results', this._on_load_more_results.bind(this));
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));
    },

    get current_page() {
        return this._current_page;
    },

    _get_knob_css: function (css_data) {
        let str = '';
        for (let key in css_data) {
            let num = (key.match(/\d+/) || [])[0];
            if (/snippet[0-2]/.test(key)) {
                str += ArticleSnippetCard.get_css_for_module(css_data[key], num);
            } else if (/article_page[0-2]/.test(key)) {
                str += ReaderDocumentCard.get_css_for_module(css_data[key], num);
            } else if (/reader_card[0-2]/.test(key)) {
                str += ReaderCard.get_css_for_module(css_data[key], num);
            } else if (key === 'done_page') {
                str += ReaderBackCover.get_css_for_module(css_data[key]);
            } else if (key === 'overview_page') {
                str += OverviewPage.get_css_for_module(css_data[key]);
            }
        }
        return str;
    },

    /*
     * FIXME: This function will change once we have finalized the structure
     * of the app.json. Load both the base library css styles and the theme specific
     * styles. Make sure to apply the theme styling second, so that
     * it gets priority.
     */
    load_theme: function () {
        let css_path = Gio.File.new_for_uri(DATA_RESOURCE_PATH).get_child('css');
        let css_files = [css_path.get_child('endless_reader.css')];
        // FIXME: Get theme from app.json once we have finalized that
        let theme = 'jungle';
        if (typeof theme !== 'undefined') {
            //css_files.push(css_path.get_child('themes').get_child(theme + '.css'));
        }
        let all_css = css_files.reduce((str, css_file) => {
            return str + css_file.load_contents(null)[1];
        }, '');
        all_css += this._get_knob_css(this._style_knobs);
        let provider = new Gtk.CssProvider();
        provider.load_from_data(all_css);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    _ARTICLE_PAGE: 'article',
    _SEARCH_PAGE: 'search',
    _OVERVIEW_PAGE: 'overview',
    _DONE_PAGE: 'done',

    // Launcher override
    search: function (timestamp, query) {
        this._pending_present_timestamp = timestamp;
        this._ensure_content_loaded(() => {
            this._on_search(query);
        });
    },

    _on_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        // Ignore empty queries
        if (sanitized_query.length === 0)
            return;
        this.record_search_metric(query);

        this._history_presenter.set_current_item_from_props({
            page_type: this._SEARCH_PAGE,
            query: sanitized_query,
        });
    },

    _perform_search: function (query) {
        this._search_query = query;
        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
        });

        this.view.lock_ui();

        this.engine.get_objects_by_query(query_obj,
                                         null,
                                         this._load_search_results.bind(this));
    },

    _add_history_item_for_page: function (page_index) {
        if (page_index === 0) {
            this._history_presenter.set_current_item_from_props({
                page_type: this._OVERVIEW_PAGE,
            });
        } else if (page_index === this.view.total_pages - 1) {
            this._history_presenter.set_current_item_from_props({
                page_type: this._DONE_PAGE,
            });
        } else {
            this._history_presenter.set_current_item_from_props({
                page_type: this._ARTICLE_PAGE,
                model: this._article_models[page_index - 1],
            });
        }
    },

    _on_history_item_change: function (presenter, item) {
        this.view.search_box.set_text_programmatically(item.query);
        switch (item.page_type) {
            case this._SEARCH_PAGE:
                this._perform_search(item.query);
                break;
            case this._ARTICLE_PAGE:
                this._go_to_article(item.model, item.from_global_search);
                break;
            case this._OVERVIEW_PAGE:
                this._go_to_page(0);
                break;
            case this._DONE_PAGE:
                this._go_to_page(this._article_models.length + 1);
                break;
            default:
                printerr("Unexpected page type " + item.page_type);
                this._go_to_page(0);
        }
    },

    _open_magazine: function () {
        this._add_history_item_for_page(0);
    },

    // Launcher override
    desktop_launch: function (timestamp=Gdk.CURRENT_TIME) {
        this._pending_present_timestamp = timestamp;
        this._ensure_content_loaded(() => {
            this._add_history_item_for_page(this.settings.bookmark_page);
        });
    },

    // Launcher override
    activate_search_result: function (timestamp, id, query) {
        this._pending_present_timestamp = timestamp;
        this._ensure_content_loaded(() => {
            this.engine.get_object_by_id(id, null, (engine, task) => {
                let model;
                try {
                    model = engine.get_object_by_id_finish(task);
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: model,
                        query: query,
                        from_global_search: true,
                    });
                } catch (error) {
                    logError(error);
                    this._show_specific_error_page();
                    this._present_if_needed();
                }
            });
        });
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(_SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    _is_archived: function (model) {
        let already_read = model.article_number < this.settings.start_article;
        let not_read_yet = model.article_number >= this.settings.start_article + TOTAL_ARTICLES;
        return already_read || not_read_yet;
    },

    _clear_webview_from_map: function (index) {
        this.view.get_article_page(index).clear_content();
        delete this._webview_map[index];
    },

    // Clear out all existing content in preparation for loading a new issue.
    _clear_content: function () {
        // Make sure to drop all references to webviews we are holding.
        for (let article_index in this._webview_map) {
            this._clear_webview_from_map(article_index);
        }
        // Clear out state from any issue that was already displaying.
        this._article_models = [];
        this.view.remove_all_article_pages();
        this.view.overview_page.remove_all_snippets();
    },

    _append_results: function (results) {
        this._total_fetched += RESULTS_SIZE;
        this._create_pages_from_models(results);
    },

    _load_new_issue: function () {
        // Load all articles in this issue
        this._clear_content();
        this._ensure_content_loaded((error) => {
            if (!error)
                this._add_history_item_for_page(0);
        });
    },

    _check_for_content_update: function() {
        let now = new Date();
        let last_update = new Date(this.settings.update_timestamp);
        if (now - last_update >= UPDATE_INTERVAL_MS) {
            this._update_content();
        }
    },

    _on_load_more_results: function () {
        if (!this._get_more_results_query)
            return;
        this.engine.get_objects_by_query(this._get_more_results_query,
                                         null,
                                         (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            let cards = results.map(this._new_card_from_article_model, this);
            if (cards.length > 0)
                this.view.search_results_page.append_search_results(cards);
            this._get_more_results_query = get_more_results_query;
        });
    },

    _load_search_results: function (engine, task) {
        this.view.unlock_ui();
        let results, get_more_results_query;
        try {
            [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
        } catch (error) {
            logError(error);
            return;
        }

        if (results.length === 0) {
            this._history_presenter.history_model.current_item.empty = true;
            this.view.search_results_page.clear_search_results();
            this.view.search_results_page.no_results_label.show();
            this.view.show_search_results_page();
        } else {
            this.view.search_results_page.clear_search_results();
            this.view.search_results_page.no_results_label.hide();

            this.view.search_results_page.append_search_results(results.map(this._new_card_from_article_model, this));

            this._get_more_results_query = get_more_results_query;
            this.view.show_search_results_page();
        }
        this._present_if_needed();
    },

    _new_card_from_article_model: function (model) {
        // We increment the page number to account for the 0-based index.
        // Note: _get_page_number_for_article_model will return -1 only if it's an
        // "Archived" issue, case in which the card doesn't require a card number.
        let article_page_number = this._get_page_number_for_article_model(model) + 1;
        let card = this.factory.create_named_module('results-card', {
            model: model,
            page_number: article_page_number,
        });
        card.connect('clicked', () => {
            this._on_article_card_clicked(model);
        });
        return card;
    },

    _update_content: function () {
        this.settings.update_timestamp = new Date().toISOString();
        this.settings.start_article = this.settings.highest_article_read;
        this.settings.bookmark_page = 0;
    },

    _present_if_needed: function () {
        if (this._pending_present_timestamp !== null) {
            this.view.show_all();
            this.view.present_with_time(this._pending_present_timestamp);
            this._pending_present_timestamp = null;
        }
    },

    _ensure_content_loaded: function (callback) {
        if (this._article_models.length > 0) {
            callback();
            return;
        }

        this._total_fetched = 0;
        let query_obj = new QueryObject.QueryObject({
            offset: this.settings.start_article,
            limit: RESULTS_SIZE,
            sort: QueryObject.QueryObjectSort.ARTICLE_NUMBER,
            tags: ['EknArticleObject'],
        });
        this.engine.get_objects_by_query(query_obj,
                                         null,
                                         (engine, task) => {
            let results, get_more_results_query;
            let error;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                error = e;
            }

            if (!error && results.length < 1 && this.settings.start_article === 0) {
                error = GLib.Error.new_literal(Gio.io_error_quark(),
                    Gio.IOErrorEnum.NOT_FOUND,
                    'No content found for this magazine');
            }

            if (error) {
                logError(error);
                this._show_general_error_page();
                this._present_if_needed();
            } else if (results.length < 1) {
                // We have exhausted all articles in this magazine.
                // Reset counter and start from beginning!
                this.settings.start_article = 0;
                this.settings.bookmark_page = 0;
            } else {
                this._fetch_content_recursive(results, get_more_results_query, callback, this._append_results.bind(this));
            }
        });
    },

    _fetch_content_recursive: function (results, get_more_results_query, callback, progress_callback) {
        progress_callback(results);
        if (results.length < RESULTS_SIZE || this._total_fetched >= TOTAL_ARTICLES) {
            // We now have all the articles we want to show. Now we load the
            // HTML content for the first few pages into the webview.
            this._load_overview_snippets_from_articles();
            callback();
            return;
        }

        this.engine.get_objects_by_query(get_more_results_query,
                                         null,
                                         (engine, task) => {
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                this._show_general_error_page();
                this._present_if_needed();
            }

            this._fetch_content_recursive(results, get_more_results_query, callback, progress_callback);
        });
    },

    _go_to_article: function (model, from_global_search) {
        if (this._is_archived(model)) {
            this._load_standalone_article(model);
            if (from_global_search) {
                this.view.show_global_search_standalone_page();
            } else {
                this.view.show_in_app_standalone_page();
            }
        } else {
            let page_number = this._get_page_number_for_article_model(model);
            this._go_to_page(page_number);
        }
        this._present_if_needed();
    },

    // Takes user to the page specified by <index>
    // Note index is with respect to all pages in the app - that is, all article
    // pages + overview page + done page. So to go to the overview page, you
    // would call this._go_to_page(0)
    _go_to_page: function (index) {
        if (this._current_page === index && this.view.article_pages_visible())
            return;

        let animation_type;
        if (!this.view.article_pages_visible()) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.NONE;
        } else if (index === this._current_page - 1) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
        } else if (index === this._current_page + 1) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
        } else if (index < this._current_page) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.MULTI_BACKWARDS_NAVIGATION;
        } else {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.MULTI_FORWARDS_NAVIGATION;
        }

        let current_article = index - 1;
        if (index === 0)
            this.view.show_overview_page(animation_type);
        else if (index === this.view.total_pages - 1)
            this.view.show_done_page(animation_type);
        else
            this.view.show_article_page(current_article, animation_type);

        // We want to always have ready on deck the webviews for the current
        // article, the article preceding the current one, and the next article.
        // These three webviews are stored in the webview_map. The key in the
        // map is the article number (not page number in the app) which those
        // pages correspond to. The values in the map are the EknWebview objects
        // for those articles. E.g. if you are on page 7, you'd have a
        // webview_map like:
        // {6: <webview_object>, 7: <webview_object>, 8: <webview_object>}

        // The range of article numbers for which we want to store webviews (the
        // current, the preceding, the next), excluding negative index values.
        let article_index_range = [
            current_article - 1,
            current_article,
            current_article + 1
        ].filter((index) => index in this._article_models);

        // Clear out any webviews in the map that we don't need anymore
        for (let article_index in this._webview_map) {
            if (article_index_range.indexOf(Number(article_index)) === -1)
                this._clear_webview_from_map(article_index);
        }

        // Add to the map any webviews we do now need.
        article_index_range.filter((index) => {
            return !(index in this._webview_map);
        }).forEach((index) => {
            let document_card = this.view.get_article_page(index);
            document_card.load_content(null, (card, task) => {
                try {
                    card.load_content_finish(task);
                } catch (error) {
                    logError(error);
                    this._show_specific_error_page();
                }
            });
            this._connect_card(document_card);
            this._webview_map[index] = document_card;
        });

        this._current_page = index;
        this.notify('current-page');
        // Guaranteed to have changed; we returned early if not changed.

        this.settings.bookmark_page = index;
        this._update_button_visibility();
        this._present_if_needed();
    },

    _connect_card: function (document_card) {
        document_card.content_view.connect('mouse-target-changed', (view, hit_test, modifiers) => {
            if (!hit_test.context_is_link()) {
                this._remove_link_tooltip();
                return;
            }
            let uri = Compat.normalize_old_browser_urls(hit_test.link_uri);
            // Links to images within the database will open in a lightbox
            // instead. This is determined in the HTML by the eos-image-link
            // class, but we don't have access to that information here.
            if (hit_test.context_is_image() && uri.startsWith('ekn://')) {
                this._remove_link_tooltip();
                return;
            }
            let mouse_position = this._get_mouse_coordinates(view);

            // Wait for the DBus interface to appear on the bus
            let watch_id = Gio.DBus.watch_name(Gio.BusType.SESSION,
                this._dbus_name, Gio.BusNameWatcherFlags.NONE,
                (connection, name, owner) => {
                    let webview_object_path = DBUS_WEBVIEW_EXPORT_PATH +
                        view.get_page_id();
                    let ProxyConstructor =
                        Gio.DBusProxy.makeProxyWrapper(DBUS_TOOLTIP_INTERFACE);
                    let proxy = new ProxyConstructor(connection,
                        this._dbus_name, webview_object_path);
                    proxy.GetCoordinatesRemote(mouse_position, (coordinates, error) => {
                        // Fall back to just popping up the tooltip at the
                        // mouse's position if there was an error.
                        if (error)
                            coordinates = [[mouse_position[0],
                                mouse_position[1], 1, 1]];
                        this._setup_link_tooltip(view, uri, coordinates[0]);
                        Gio.DBus.unwatch_name(watch_id);
                    });
                },
                null  // do nothing when name vanishes
            );
        });
    },

    // First article data has been loaded asynchronously; now we can start
    // loading its content, and show the window. Until this point the user will
    // have seen the loading splash screen. Also start loading the rest of the
    // pages, asynchronously.
    _create_pages_from_models: function (models) {
        models.forEach(function (model) {
            let page = this._create_article_page_from_article_model(model);
            this.view.append_article_page(page);
            this._update_button_visibility();
        }, this);
        this._article_models = this._article_models.concat(models);
    },

    _get_mouse_coordinates: function (view) {
        let display = Gdk.Display.get_default();
        let device_man = display.get_device_manager();
        let device = device_man.get_client_pointer();
        let [win, x, y, mask] = view.window.get_device_position(device);
        return [x, y];
    },

    _setup_link_tooltip: function (view, uri, coordinates) {
        let filtered_indices = [];
        let filtered_models = this._article_models.filter((model, index) => {
            if (model.ekn_id === uri)
                filtered_indices.push(index);
            return (model.ekn_id === uri);
        });

        // If a model is filtered by the uri, it means it's an in-issue article.
        if (filtered_models.length > 0) {
            // We expect to have one article model that matches the given uri,
            // hence we obtain the first filtered model and first matched index.
            // Note: The page number argument is incremented by two, to account
            // for the 0-base index and the overview page.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_IN_ISSUE_LINK,
                filtered_models[0].title, filtered_indices[0] + 2);
        } else if (GLib.uri_parse_scheme(uri) === 'ekn') {
            // If there is no filtered model but the uri has the "ekn://" prefix,
            // it's an archive article.
            this.engine.get_object_by_id(uri,
                                         null,
                                         (engine, task) => {
                let article_model;
                try {
                    article_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not get article model');
                    return;
                }
                this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_ARCHIVE_LINK,
                    article_model.title, 0);
            });
        } else if (GLib.uri_parse_scheme(uri) === 'file' && uri.indexOf('/licenses/') > -1) {
            // If the uri has the "file://" scheme and it includes a segments for "licenses",
            // it corresponds to a license file, and we should display it as an external link.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_EXTERNAL_LINK,
                _("View the license in your browser"), 0);
        } else {
            // Otherwise, it's an external link. The URI is displayed as the title.
            this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_EXTERNAL_LINK,
                uri, 0);
        }
    },

    _remove_link_tooltip: function () {
        if (this._link_tooltip) {
            this._link_tooltip.destroy();
            this._link_tooltip = null;
        }
    },

    _display_link_tooltip: function (view, coordinates, tooltip_type, tooltip_title,
        page_number) {
        this._remove_link_tooltip();

        this._link_tooltip = new WebviewTooltip.WebviewTooltip({
            type: tooltip_type,
            title: tooltip_title,
            page_number: page_number,
            relative_to: view,
            pointing_to: new cairo.RectangleInt({
                x: coordinates[0],
                y: coordinates[1],
                width: coordinates[2],
                height: coordinates[3],
            }),
        });
        this._link_tooltip.connect('leave-notify-event', () => {
            this._remove_link_tooltip();
        });
        this._link_tooltip.show_all();
    },

    _article_render_callback: function (article_model) {
        return this._article_renderer.render(article_model, {
            custom_css_files: ['reader.css'],
        });
    },

    _update_button_visibility: function () {
        this.view.nav_buttons.forward_visible = this.view.article_pages_visible();
        this.view.nav_buttons.back_visible = (this._current_page > 0);
    },

    // Take an ArticleObjectModel and create a ReaderDocumentCard view.
    _create_article_page_from_article_model: function (model) {
        let document_card = this.factory.create_named_module('document-card', {
            model: model,
            page_number: model.article_number,
        });
        document_card.connect('ekn-link-clicked', (card, uri) => {
            this._remove_link_tooltip();
            let scheme = GLib.uri_parse_scheme(uri);
            if (scheme !== 'ekn')
                return;

            this.engine.get_object_by_id(uri, null, (engine, task) => {
                let clicked_model;
                try {
                    clicked_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not open link from reader article');
                    return;
                }

                if (clicked_model instanceof MediaObjectModel.MediaObjectModel) {
                    this._lightbox_presenter.show_media_object(card.model, clicked_model);
                } else if (clicked_model instanceof ArticleObjectModel.ArticleObjectModel) {
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: clicked_model,
                    });
                }
            });
        });

        return document_card;
    },

    _get_page_number_for_article_model: function(model) {
        let filtered_indices = [];
        this._article_models.filter((article_model, index) => {
            if (article_model.article_number === model.article_number)
                filtered_indices.push(index);
            return (article_model.article_number === model.article_number);
        });

        if (filtered_indices.length === 0) {
            // Article model not found in this issue's article array!
            return -1;
        } else {
            // We expect to have one filtered element, hence we return that filtered index
            // We increment by one to account for cover page.
            return filtered_indices[0] + 1;
        }
    },

    // Show a friendlier error message when the engine is not working; suggest
    // restarting the computer because that's the only thing under the user's
    // control at this point that might get the knowledge engine back up. This is
    // in order to prevent the "Message Corrupt" effect.
    _create_error_label: function (headline, message) {
        let err_label = new Gtk.Label({
            label: '<span size="xx-large"><b>' + headline + '</b></span>\n' + message,
            justify: Gtk.Justification.CENTER,
            use_markup: true,
        });
        err_label.get_style_context().add_class(StyleClasses.READER_ERROR_PAGE);
        err_label.show();
        return err_label;
    },

    _show_error_page: function (headline, message) {
        let err_label = this._create_error_label(headline, message);
        this.view.page_manager.add(err_label);
        this.view.page_manager.visible_child = err_label;
    },

    // Use _create_error_label to show a general error page, when there is no
    // content.
    _show_general_error_page: function () {
        this._show_error_page(_("Oops!"),
            _("We could not find this magazine!\nPlease try again after restarting your computer."));
    },

    // Use _create_error_label to show a specific error page, when a particular
    // page couldn't be found.
    _show_specific_error_page: function () {
        this._show_error_page(_("Oops!"),
            _("There was an error loading that page.\nTry another one or try again after restarting your computer."));
    },

    _load_overview_snippets_from_articles: function () {
        let snippets = this._article_models.slice(0, NUM_OVERVIEW_SNIPPETS).map((model) => {
            let snippet = this.factory.create_named_module('home-card', {
                model: model,
            });
            snippet.connect('clicked', function () {
                this._history_presenter.set_current_item_from_props({
                    page_type: this._ARTICLE_PAGE,
                    model: model,
                });
            }.bind(this));
            return snippet;
        });
        this.view.overview_page.set_article_snippets(snippets);
    },

    _load_standalone_article: function (model) {
        let frame = new Gtk.Frame();
        // Ensures that the archive notice on the in app standalone page
        // matches that of the standalone page you reach via global search
        frame.add(new ArchiveNotice.ArchiveNotice({
            label: this.view.standalone_page.infobar.archive_notice.label,
        }));
        frame.get_style_context().add_class(StyleClasses.READER_ARCHIVE_NOTICE_FRAME);
        let document_card = this.factory.create_named_module('document-card', {
            model: model,
            info_notice: frame,
        });
        document_card.load_content(null, (card, task) => {
            try {
                card.load_content_finish(task);
            } catch (error) {
                logError(error);
                this._show_error_page();
            }
        });
        this.view.standalone_page.document_card = document_card;
    },

    _on_article_card_clicked: function (model) {
        this._history_presenter.set_current_item_from_props({
            page_type: this._ARTICLE_PAGE,
            model: model,
        });
    },

    _on_search_text_changed: function (entry) {
        let query = Utils.sanitize_query(this.view.search_box.text);
        // Ignore empty queries
        if (query.length === 0) {
            return;
        }

        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
        });

        this.engine.get_objects_by_query(query_obj,
                                         null,
                                         (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            this.view.search_box.set_menu_items(results.map((model) => {
                return {
                    title: model.title,
                    id: model.ekn_id,
                };
            }));
        });
    },

    _on_search_menu_item_selected: function (entry, id) {
        this.engine.get_object_by_id(id,
                                     null,
                                     (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                this._show_specific_error_page();
                return;
            }

            this._history_presenter.set_current_item_from_props({
                page_type: this._ARTICLE_PAGE,
                model: model,
            });
        });
    },
});
