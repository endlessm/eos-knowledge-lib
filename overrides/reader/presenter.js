const cairo = imports.gi.cairo;  // note: GI module, not native GJS module
const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticleHTMLRenderer = imports.articleHTMLRenderer;
const ArticlePage = imports.reader.articlePage;
const Config = imports.config;
const EknWebview = imports.eknWebview;
const Engine = imports.engine;
const HistoryItem = imports.historyItem;
const Launcher = imports.launcher;
const OverviewPage = imports.reader.overviewPage;
const Previewer = imports.previewer;
const ReaderCard = imports.reader.card;
const UserSettingsModel = imports.reader.userSettingsModel;
const Utils = imports.utils;
const WebkitURIHandlers = imports.webkitURIHandlers;
const WebviewTooltip = imports.reader.webviewTooltip;
const Window = imports.reader.window;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;
const TOTAL_ARTICLES = 30;
const NUM_SNIPPET_STYLES = 3;
const NUM_OVERVIEW_SNIPPETS = 3;

// 1 week in miliseconds
const UPDATE_INTERVAL_MS = 604800000;

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
    Extends: Launcher.Launcher,
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
        let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        props.view = props.view || new Window.Window({
            application: props.application,
        });
        props.engine = props.engine || EosKnowledgeSearch.Engine.get_default();
        props.settings = props.settings || new UserSettingsModel.UserSettingsModel({
            settings_file: Gio.File.new_for_path(props.application.config_dir.get_path() + '/user_settings.json'),
        });

        this._current_page_style_variant = 0;

        this.parent(props);

        WebkitURIHandlers.register_webkit_uri_handlers();

        let app_id = this.application.application_id;
        let pid = new Gio.Credentials().get_unix_pid();
        this._dbus_name = app_id + pid;

        let web_context = WebKit2.WebContext.get_default();
        web_context.connect('initialize-web-extensions', () => {
            web_context.set_web_extensions_directory(Config.PKGLIBDIR);
            let well_known_name = new GLib.Variant('s', this._dbus_name);
            web_context.set_web_extensions_initialization_user_data(well_known_name);
        });

        this._article_renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        this._check_for_content_update();
        this._parse_app_info(app_json);

        this._webview_map = {};
        this._article_models = [];

        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this.view.lightbox.content_widget = this._previewer;

        // lock to ensure we're only loading one lightbox media object at a
        // time
        this._loading_new_lightbox = false;

        this._latest_origin_query = '{}';
        this.history_model = new EosKnowledge.HistoryModel();

        // Connect signals
        this.view.history_buttons.back_button.connect('clicked', this._on_topbar_back_clicked.bind(this));
        this.view.history_buttons.forward_button.connect('clicked', this._on_topbar_forward_clicked.bind(this));
        this.history_model.bind_property('can-go-forward', this.view.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.history_model.bind_property('can-go-back', this.view.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);

        this.view.nav_buttons.connect('back-clicked', function () {
            this._update_history_model(this._current_page - 1);
            this._go_to_page(this._current_page - 1, EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            this._update_history_model(this._current_page + 1);
            this._go_to_page(this._current_page + 1, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
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
        this.view.connect('lightbox-nav-previous-clicked', this._on_lightbox_previous_clicked.bind(this));
        this.view.connect('lightbox-nav-next-clicked', this._on_lightbox_next_clicked.bind(this));

        this.view.standalone_page.infobar.connect('response', this._open_magazine.bind(this));
        this.view.search_box.connect('activate', (search_entry) => {
            this._update_ui_and_search(search_entry.text);
        });
    },

    get current_page() {
        return this._current_page;
    },

    _ARTICLE_PAGE: 'article',
    _SEARCH_PAGE: 'search',
    _OVERVIEW_PAGE: 'overview',
    _DONE_PAGE: 'done',

    // EosKnowledge.launcher override
    search: function (timestamp, query) {
        this._update_ui_and_search(query);
        this.view.present_with_time(timestamp);
    },

    _update_ui_and_search: function (query) {
        query = Utils.sanitize_query(query);

        // Ignore empty queries
        if (query.length === 0) {
            return;
        }
        let query_obj = {
            q: query,
            limit: RESULTS_SIZE,
        };

        this.view.search_box.text = query;
        this._add_history_object_for_search_page(JSON.stringify(query_obj));
        this._perform_search(this.view, query_obj);
    },

    _perform_search: function (view, query) {
        this._search_query = query.q;
        this.view.lock_ui();

        this.engine.get_objects_by_query(query, this._load_search_results.bind(this));
    },

    _update_history_model: function (page_index) {
        if (page_index === 0) {
            this._add_history_object_for_overview_page();
        } else if (page_index === this.view.total_pages - 1) {
            this._add_history_object_for_done_page();
        } else {
            this._add_history_object_for_article_page(this._article_models[page_index - 1]);
        }
    },

    _add_history_object_for_article_page: function (model) {
        this.history_model.current_item = new HistoryItem.HistoryItem({
            title: model.title,
            page_type: this._ARTICLE_PAGE,
            article_model: model,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_search_page: function (query) {
        this._latest_origin_query = query;
        this.history_model.current_item = new HistoryItem.HistoryItem({
            page_type: this._SEARCH_PAGE,
            query: query,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_overview_page: function () {
        this.history_model.current_item = new HistoryItem.HistoryItem({
            page_type: this._OVERVIEW_PAGE,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_done_page: function () {
        this.history_model.current_item = new HistoryItem.HistoryItem({
            page_type: this._DONE_PAGE,
            article_origin_query: this._latest_origin_query,
        });
    },

    _replicate_history_state: function (animation_type) {
        let article_origin_query = JSON.parse(this.history_model.current_item.article_origin_query);
        if (article_origin_query.hasOwnProperty('q'))
            this.view.search_box.text = article_origin_query.q;
        else
            this.view.search_box.text = '';

        switch (this.history_model.current_item.page_type) {
            case this._SEARCH_PAGE:
                this._perform_search(this.view, JSON.parse(this.history_model.current_item.query));
                break;
            case this._ARTICLE_PAGE:
                this._go_to_article(this.history_model.current_item.article_model, animation_type);
                break;
            case this._OVERVIEW_PAGE:
                this._go_to_page(0, animation_type);
                break;
            case this._DONE_PAGE:
                this._go_to_page(this._article_models.length + 1, animation_type);
                break;
            default:
                printerr("Unexpected page type " + this.history_model.current_item.page_type);
                this._go_to_page(0, animation_type);
        }

        // Update latest origin query.
        if (this.history_model.current_item.article_origin_query !== this._latest_origin_query) {
            this._latest_origin_query = this.history_model.current_item.article_origin_query;
        }
    },

    _open_magazine: function () {
        this._go_to_page(0, EosKnowledge.LoadingAnimationType.NONE);
        this._add_history_object_for_overview_page();
    },

    // EosKnowledge.Launcher override
    desktop_launch: function (timestamp=Gdk.CURRENT_TIME) {
        // Load all articles in this issue
        this._load_all_content(/* callback */ (error) => {
            if (error) {
                printerr(error);
                printerr(error.stack);
                this._show_general_error_page();
            } else {
                // We now have all the articles we want to show. Now we load the
                // HTML content for the first few pages into the webview.
                this._load_overview_snippets_from_articles();
                this._update_history_model(this.settings.bookmark_page);
                this._go_to_page(this.settings.bookmark_page, EosKnowledge.LoadingAnimationType.NONE);
            }
            this.view.show_all();
            this.view.present_with_time(timestamp);
        }, /* progress callback */ this._append_results.bind(this));
    },

    // EosKnowledge.Launcher override
    activate_search_result: function (timestamp, id, query) {
        // Check if we need to load an article separately from the normally
        // scheduled content
        this.engine.get_object_by_id(id, (error, model) => {
            if (error) {
                printerr(error);
                printerr(error.stack);
                this._show_specific_error_page();
                this.view.show_all();
                this.view.present_with_time(timestamp);
                return;
            }

            if (this._is_archived(model)) {
                // FIXME Here we should load the rest of the content in the
                // background; but as there currently isn't a way to get from
                // the standalone page to the regular content, we don't.
                this.view.show_all();
                this._load_standalone_article(model);
                this.view.show_global_search_standalone_page();
                this.view.present_with_time(timestamp);
                return;
            }

            this._load_all_content(/* callback */ (error) => {
                if (error) {
                    printerr(error);
                    printerr(error.stack);
                    this._show_general_error_page();
                } else {
                    this._load_overview_snippets_from_articles();
                    // add 1 for overview page
                    let page_number = model.article_number -
                        this.settings.start_article + 1;
                    this.view.search_box.text = query;
                    this._go_to_page(page_number, EosKnowledge.LoadingAnimationType.NONE);
                }
                this.view.show_all();
                this.view.present_with_time(timestamp);
            }, /* progress callback */ this._append_results.bind(this));
        });
    },

    _is_archived: function (model) {
        let already_read = model.article_number < this.settings.start_article;
        let not_read_yet = model.article_number >= this.settings.start_article + TOTAL_ARTICLES;
        return already_read || not_read_yet;
    },

    _clear_webview_from_map: function (index) {
        this.view.get_article_page(index).clear_content();
        this._webview_map[index].destroy();
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
        this._load_all_content(/* callback */ (error) => {
            if (error) {
                printerr(error);
                printerr(error.stack);
                this._show_general_error_page();
                return;
            }

            this._load_overview_snippets_from_articles();
            this._go_to_page(0, EosKnowledge.LoadingAnimationType.NONE);
        }, /* progress callback */ this._append_results.bind(this));
    },

    _check_for_content_update: function() {
        let now = new Date();
        let last_update = new Date(this.settings.update_timestamp);
        if (now - last_update >= UPDATE_INTERVAL_MS) {
            this._update_content();
        }
    },

    _load_search_results: function (err, results, get_more_results_func) {
        this.view.unlock_ui();

        if (err !== undefined) {
            printerr(err);
            printerr(err.stack);
        } else if (results.length === 0) {
            this.view.search_results_page.clear_search_results();
            this.view.search_results_page.no_results_label.show();
            this.view.show_search_results_page();
        } else {
            this.view.search_results_page.clear_search_results();
            this.view.search_results_page.no_results_label.hide();

            this.view.search_results_page.append_search_results(results.map(this._new_card_from_article_model, this));

            this._get_more_results = get_more_results_func;
            this.view.show_search_results_page();
        }
    },

    _new_card_from_article_model: function (model, idx) {
        let formatted_attribution = this._format_attribution_for_metadata(model.get_authors(), model.published);
        let card = new ReaderCard.Card({
            title: model.title,
            synopsis: formatted_attribution,
            page_number: model.article_number - this.settings.start_article + 2,
            style_variant: idx % 3,
            archived: this._is_archived(model),
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

    _load_all_content: function (callback, progress_callback) {
        this._total_fetched = 0;
        this.engine.get_objects_by_query({
            offset: this.settings.start_article,
            limit: RESULTS_SIZE,
            sortBy: 'articleNumber',
            order: 'asc',
            tags: ['EknArticleObject'],
        }, function (error, results, get_more_results_func) {
            if (!error && results.length < 1 && this.settings.start_article === 0) {
                error = GLib.Error.new_literal(Gio.io_error_quark(),
                    Gio.IOErrorEnum.NOT_FOUND,
                    'No content found for this magazine');
            }

            if (error) {
                callback(error);
            } else if (results.length < 1) {
                // We have exhausted all articles in this magazine.
                // Reset counter and start from beginning!
                this.settings.start_article = 0;
                this.settings.bookmark_page = 0;
            } else {
                this._fetch_content_recursive(undefined, results,
                    get_more_results_func, callback, progress_callback);
            }
        }.bind(this));
    },

    _fetch_content_recursive: function (err, results, get_more_results_func, callback, progress_callback) {
        function fetch_helper(err, results, get_more_results_func) {
            this._fetch_content_recursive(err, results, get_more_results_func,
                callback, progress_callback);
        }

        if (err !== undefined) {
            callback(err);
        } else {
            progress_callback(results);
            // If there are more results to get, then fetch more content
            if (results.length >= RESULTS_SIZE && this._total_fetched < TOTAL_ARTICLES) {
                get_more_results_func(RESULTS_SIZE, fetch_helper.bind(this));
            } else {
                callback();
            }
        }
    },

    _go_to_article: function (model, animation_type) {
        if (this._is_archived(model)) {
            this._load_standalone_article(model);
            this.view.show_in_app_standalone_page();
        } else {
            // We need to map the "go-to" model to the correct element in
            // the article models array.
            // We expect to have exactly one element filtered by article_number.
            let filtered_indices = [];
            this._article_models.filter((article_model, index) => {
                if (article_model.article_number === model.article_number)
                    filtered_indices.push(index);
                return (article_model.article_number === model.article_number);
            });
            if (filtered_indices.length !== 1) {
                throw new Error(('Something went wrong while navigating to the article! ' +
                                 'We got %d models filtered with article_number=%d!'.format(
                                 filtered_indices.length, model.article_number)));
            }
            this._go_to_page(filtered_indices[0] + 1, animation_type);
        }
    },

    // Takes user to the page specified by <index>
    // Note index is with respect to all pages in the app - that is, all article
    // pages + overview page + done page. So to go to the overview page, you
    // would call this._go_to_page(0)
    _go_to_page: function (index, animation_type) {
        if (this._current_page === index && this.view.article_pages_visible())
            return;

        let current_article = index - 1;
        if (index === 0)
            this.view.show_overview_page();
        else if (index === this.view.total_pages - 1)
            this.view.show_done_page();
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
            this._webview_map[index] = this._load_webview_content(this._article_models[index], (webview, error) => {
                this._load_webview_content_callback(this.view.get_article_page(index),
                    webview, error);
            });
        });

        this._current_page = index;
        this.notify('current-page');
        // Guaranteed to have changed; we returned early if not changed.

        this.settings.bookmark_page = index;
        this._update_button_visibility();
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
            this.engine.get_object_by_id(uri, (err, article_model) => {
                if (typeof err !== 'undefined') {
                    printerr('Could not get article model:', err);
                    printerr(err.stack);
                    return;
                }
                this._display_link_tooltip(view, coordinates, WebviewTooltip.TYPE_ARCHIVE_LINK,
                    article_model.title, 0);
            });
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

    _load_webview_content: function (article_model, ready) {
        if (ready === undefined) {
            ready = function () {};
        }
        let webview = new EknWebview.EknWebview();
        let load_id = webview.connect('load-changed', function (view, event) {
            // failsafe: disconnect on load finished even if there was an error
            if (event === WebKit2.LoadEvent.FINISHED) {
                view.disconnect(load_id);
                return;
            }
            if (event === WebKit2.LoadEvent.COMMITTED) {
                ready(view);
                view.disconnect(load_id);
                return;
            }
        });
        let fail_id = webview.connect('load-failed', function (view, event, failed_uri, error) {
            // <error> is undefined under some instances. For example, if you try to load
            // a bogus uri: http://www.sdfsdfjskkm.com
            if (error === undefined) {
                error = new Error("WebKit failed to load this uri");
            }
            ready(view, error);
        });

        webview.connect('decide-policy', function (view, decision, type) {
            this._remove_link_tooltip();
            if (type !== WebKit2.PolicyDecisionType.NAVIGATION_ACTION)
                return false; // default action

            // if this request was for the article we're trying to load,
            // proceed
            if (decision.request.uri === article_model.ekn_id) {
                ready(view);
                decision.use();
                return true;
            // otherwise, if the request was for some other EKN object, fetch
            // it and attempt to display it
            } else if (decision.request.uri.indexOf('ekn://') === 0) {
                this.engine.get_object_by_id(decision.request.uri, (err, clicked_model) => {
                    if (typeof err !== 'undefined') {
                        printerr('Could not open link from reader article:', err);
                        printerr(err.stack);
                        return;
                    }
                    if (clicked_model instanceof EosKnowledgeSearch.MediaObjectModel) {
                        this._lightbox_handler(article_model, clicked_model);
                    } else if (clicked_model instanceof EosKnowledgeSearch.ArticleObjectModel) {
                        this._add_history_object_for_article_page(clicked_model);
                        this._go_to_article(clicked_model, EosKnowledge.LoadingAnimationType.NONE);
                    }
                });

                // we're handling this EKN request our own way, so tell webkit
                // to back off
                decision.ignore();
                return true;
            }

            // for all other requests (e.g. non EKN requests), handle them in
            // the default webkit fashion
            return false;
        }.bind(this));

        webview.connect('mouse-target-changed', (view, hit_test, modifiers) => {
            if (!hit_test.context_is_link()) {
                this._remove_link_tooltip();
                return;
            }
            let uri = hit_test.link_uri;
            // This indicates that we open the link in an external viewer, but
            // don't show it to the user.
            if (uri.startsWith('browser-'))
                uri = uri.slice('browser-'.length);
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

        webview.load_html(this._article_renderer.render(article_model), article_model.ekn_id);
        return webview;
    },

    _lightbox_handler: function (current_article, media_object) {
        let resources = current_article.get_resources();
        let resource_index = resources.indexOf(media_object.ekn_id);
        if (resource_index !== -1) {
            // Checks whether forward/back arrows should be displayed.
            this._preview_media_object(media_object,
                resource_index > 0,
                resource_index < resources.length - 1);
            return true;
        }
        return false;
    },

    _load_webview_content_callback: function (page, view, error) {
        if (error !== undefined) {
            printerr(error);
            printerr(error.stack);
            this._show_specific_error_page();
        } else {
            page.show_content_view(view);
        }
    },

    _update_button_visibility: function () {
        this.view.nav_buttons.forward_visible = (this._current_page !== this.view.total_pages - 1);
        this.view.nav_buttons.back_visible = (this._current_page > 0);
    },

    // Retrieve all needed information from the app.json file, such as the app
    // ID and the app's headline.
    _parse_app_info: function (info) {
        this.view.title = info['appTitle'];
        this.view.overview_page.title_image_uri = info['titleImageURI'];
        this.view.overview_page.subtitle = info['appSubtitle'];
        this.view.overview_page.background_image_uri = info['backgroundHomeURI'];
        this.view.done_page.background_image_uri = info['backgroundSectionURI'];
        this.view.standalone_page.app_name = info['appTitle'];
        this.view.standalone_page.infobar.title_image_uri = info['titleImageURI'];
        this.view.standalone_page.infobar.background_image_uri = info['backgroundHomeURI'];
    },

    _format_attribution_for_metadata: function (authors, date) {
        let attribution_string = '';
        // TRANSLATORS: This "and" is used to join together the names
        // of authors of a blog post. For example:
        // Jane Austen and Henry Miller and William Clifford
        let authors_string = authors.join(" " + _("and") + " ");
        // TRANSLATORS: This is a string that is going to be substituted
        // by date values in code. The %B represents a month, the %e represents
        // the day, and %Y represents the year. Rearrange them how you wish to
        // match the desired locale. For example, if you wanted the date to look
        // like "1. December 2014", then you would do: "%e. %B %Y".
        let formatted_date = new Date(date).toLocaleFormat(_("%B %e, %Y"));
        if (authors.length > 0 && date) {
            // TRANSLATORS: anything inside curly braces '{}' is going
            // to be substituted in code. Please make sure to leave the
            // curly braces around any words that have them and DO NOT
            // translate words inside curly braces.
            attribution_string = _("by {author} on {date}").replace("{author}", authors_string)
            .replace("{date}", formatted_date);
        } else if (authors.length > 0) {
            // TRANSLATORS: anything inside curly braces '{}' is going
            // to be substituted in code. Please make sure to leave the
            // curly braces around any words that have them and DO NOT
            // translate words inside curly braces.
            attribution_string = _("by {author}").replace("{author}", authors_string);
        } else if (date) {
            // FIXME: must be nicely formatted according to locale
            attribution_string = formatted_date;
        }
        return attribution_string;
    },

    // Take an ArticleObjectModel and create a Reader.ArticlePage view.
    _create_article_page_from_article_model: function (model) {
        let formatted_attribution = this._format_attribution_for_metadata(model.get_authors(), model.published);
        let article_page = new ArticlePage.ArticlePage();
        article_page.title_view.title = model.title;
        article_page.title_view.attribution = formatted_attribution;
        this._assign_style_to_page(article_page);
        return article_page;
    },

    // Assigns a style to article pages, so that we can handle alternating design
    // for title assets.
    _assign_style_to_page: function (page) {
        let style_variant = this._current_page_style_variant % this._NUM_ARTICLE_PAGE_STYLES;
        this._current_page_style_variant++;
        page.get_style_context().add_class('article-page' + style_variant);
        page.title_view.style_variant = style_variant;
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
        err_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ERROR_PAGE);
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
        let snippets = this._article_models.slice(0, NUM_OVERVIEW_SNIPPETS).map((model, ix) => {
            let snippet = new OverviewPage.ArticleSnippet({
                title: model.title,
                synopsis: model.synopsis,
                style_variant: ix % NUM_SNIPPET_STYLES,
            });
            snippet.connect('clicked', function () {
                // idx is the article model index so need to add one (account
                // for overview page) to get the corresponding article page index.
                this._add_history_object_for_article_page(model);
                this._go_to_page(ix + 1, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
            }.bind(this));
            Utils.set_hand_cursor_on_widget(snippet);
            return snippet;
        });
        this.view.overview_page.set_article_snippets(snippets);
    },

    _lightbox_shift_image: function (lightbox, delta) {
        if (typeof lightbox.media_object === 'undefined' || this._loading_new_lightbox) {
            return;
        }

        let resources = this._article_models[this.current_page - 1].get_resources();
        let current_index = resources.indexOf(lightbox.media_object.ekn_id);

        if (current_index === -1) {
            return;
        }

        let new_index = current_index + delta;
        let target_object_uri = resources[new_index];

        this._loading_new_lightbox = true;
        this.engine.get_object_by_id(target_object_uri, (err, target_object) => {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
                return;
            }

            // If the next object is not the last, the forward arrow should be displayed.
            this._preview_media_object(target_object,
                new_index > 0,
                new_index < resources.length - 1);
            this._loading_new_lightbox = false;
        });
    },

    _on_lightbox_previous_clicked: function (view, lightbox) {
        this._lightbox_shift_image(lightbox, -1);
    },

    _on_lightbox_next_clicked: function (view, lightbox) {
        this._lightbox_shift_image(lightbox, 1);
    },

    _preview_media_object: function (media_object, previous_arrow_visible, next_arrow_visible) {
        this._previewer.file = Gio.File.new_for_uri(media_object.content_uri);
        this.view.lightbox.media_object = media_object;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_back_button = previous_arrow_visible;
        this.view.lightbox.has_forward_button = next_arrow_visible;
    },

    _load_standalone_article: function (model) {
        this._standalone = this._load_webview_content(model, (webview, error) => {
            this._load_webview_content_callback(this.view.standalone_page.article_page, webview, error);
        });
        this.view.standalone_page.article_page.title_view.title = model.title;
        this.view.standalone_page.article_page.title_view.attribution =
            this._format_attribution_for_metadata(model.get_authors(), model.published);
        this.view.standalone_page.article_page.get_style_context().add_class('article-page0');
    },

    /*
     * Navigates to the previous page by moving the history model back a page and checking the
     * history object for information to replicate that previous page's query.
     */
    _on_topbar_back_clicked: function () {
        this.history_model.go_back();
        this._replicate_history_state(EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
    },

    /*
     * Navigates to the next page by moving the history model forward a page and checking the
     * history object for information to replicate that next page's query.
     */
    _on_topbar_forward_clicked: function () {
        this.history_model.go_forward();
        this._replicate_history_state(EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
    },

    _on_article_card_clicked: function (model) {
        this._go_to_article(model, EosKnowledge.LoadingAnimationType.NONE);
        this._add_history_object_for_article_page(model);
    },
});
