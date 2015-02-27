const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Format = imports.format;
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
const Previewer = imports.previewer;
const UserSettingsModel = imports.reader.userSettingsModel;
const Utils = imports.utils;
const WebkitURIHandlers = imports.webkitURIHandlers;
const Window = imports.reader.window;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;
const TOTAL_ARTICLES = 30;
const NUM_SNIPPET_STYLES = 3;

// 1 week in miliseconds
const UPDATE_INTERVAL_MS = 604800000;

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

        this._article_renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        this._check_for_content_update();
        this._parse_app_info(app_json);

        this._webview_map = {};
        this._article_models = [];

        // Load all articles in this issue
        this._load_all_content();

        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this.view.lightbox.content_widget = this._previewer;

        // lock to ensure we're only loading one lightbox media object at a
        // time
        this._loading_new_lightbox = false;

        // Connect signals
        this.view.nav_buttons.connect('back-clicked', function () {
            this._go_to_page(this._current_page - 1);
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            this._go_to_page(this._current_page + 1);
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
        this.settings.connect('notify::start-article', this._load_all_content.bind(this));
        let handler = this.view.connect('debug-hotkey-pressed', function () {
            this.view.issue_nav_buttons.show();
            this.view.disconnect(handler);  // One-shot signal handler only.
        }.bind(this));
        this.view.connect('lightbox-nav-previous-clicked', this._on_lightbox_previous_clicked.bind(this));
        this.view.connect('lightbox-nav-next-clicked', this._on_lightbox_next_clicked.bind(this));
    },

    get current_page() {
        return this._current_page;
    },

    // Right now these functions are just stubs which we will need to flesh out
    // if we ever want to register search providers for the reader apps. The
    // former will be called by ekn-app-runner if the user asks to view a search
    // query within an application, and the latter if the user asks to view a
    // specific article.
    search: function (query) {},
    activate_search_result: function (model, query) {},

    _clear_webview_from_map: function (index) {
        this.view.get_article_page(index).clear_content();
        this._webview_map[index].destroy();
        delete this._webview_map[index];
    },

    _check_for_content_update: function() {
        if (Date.now() - this.settings.update_timestamp >= UPDATE_INTERVAL_MS) {
            this._update_content();
        }
    },

    _update_content: function () {
        this.settings.update_timestamp = Date.now();
        this.settings.start_article = this.settings.highest_article_read;
        this.settings.bookmark_page = 0;
    },

    _load_all_content: function () {
        this._total_fetched = 0;
        this.engine.get_objects_by_query({
            offset: this.settings.start_article,
            limit: RESULTS_SIZE,
            sortBy: 'articleNumber',
            order: 'asc',
            tags: ['EknArticleObject'],
        }, function (error, results, get_more_results_func) {
            // Make sure to drop all references to any webviews we are holding.
            for (let article_index in this._webview_map) {
                this._clear_webview_from_map(article_index);
            }
            // Clear out state from any issue that was already displaying.
            this._article_models = [];
            this.view.remove_all_article_pages();
            this.view.overview_page.remove_all_snippets();

            if (error !== undefined || results.length < 1) {
                if (error !== undefined) {
                    printerr(error);
                    printerr(error.stack);
                }
                let err_label = this._create_error_label(_("Oops!"),
                    _("We could not find this magazine!\nPlease try again after restarting your computer."));
                this.view.page_manager.add(err_label);
                this.view.page_manager.visible_child = err_label;
                this.view.show_all();
            } else {
                this._fetch_content_recursive(undefined, results, get_more_results_func);
            }
        }.bind(this));
    },

    _fetch_content_recursive: function (err, results, get_more_results_func) {
        if (err !== undefined) {
            printerr(err);
            printerr(err.stack);
        } else {
            this._total_fetched += RESULTS_SIZE;
            this._create_pages_from_models(results);
            // If there are more results to get, then fetch more content
            if (results.length >= RESULTS_SIZE && this._total_fetched < TOTAL_ARTICLES) {
                get_more_results_func(RESULTS_SIZE, this._fetch_content_recursive.bind(this));
            } else {
                // We now have all the articles we want to show. Now we load the HTML content
                // for the first few pages into the webview
                this._load_overview_snippets_from_articles();
                this._go_to_page(this.settings.bookmark_page);
                this.view.show_all();
            }
        }
    },

    // Takes user to the page specified by <index>
    // Note index is with respect to all pages in the app - that is, all article
    // pages + overview page + done page. So to go to the overview page, you
    // would call this._go_to_page(0)
    _go_to_page: function (index) {
        if (this._current_page === index)
            return;

        let current_article = index - 1;
        if (index === 0)
            this.view.show_overview_page();
        else if (index === this.view.total_pages - 1)
            this.view.show_done_page();
        else
            this.view.show_article_page(current_article, this._current_page < index);

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
                        // FIXME: navigate to the requested article and display
                        // the "archived" banner if it's not in the current
                        // issue:
                        // https://github.com/endlessm/eos-sdk/issues/2681
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
            let err_page = this._create_error_label(_("Oops!"),
                _("There was an error loading that page.\nTry another one or try again after restarting your computer."));
            page.show_content_view(err_page);
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
        this.view.overview_page.background_image_uri = info['backgroundHomeURI'];
        this.view.done_page.background_image_uri = info['backgroundSectionURI'];
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

    _load_overview_snippets_from_articles: function () {
        let snippets = this._article_models.map((snippet, ix) => {
            return {
                title: snippet.title,
                synopsis: snippet.synopsis,
                style_variant: ix % NUM_SNIPPET_STYLES,
            };
        });
        this.view.overview_page.set_article_snippets(snippets);
    },

    _lightbox_shift_image: function (lightbox, delta) {
        if (typeof lightbox.media_object === 'undefined' || this._loading_new_lightbox) {
            return;
        }

        let resources = this._article_models[this.view.current_page - 1].get_resources();
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
});
