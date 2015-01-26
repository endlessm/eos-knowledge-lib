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

const ArticlePage = imports.reader.articlePage;
const Config = imports.config;
const EknWebview = imports.eknWebview;
const Engine = imports.engine;
const UserSettingsModel = imports.reader.userSettingsModel;
const Utils = imports.utils;
const WebkitURIHandlers = imports.webkitURIHandlers;
const Window = imports.reader.window;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;
const NUM_SNIPPETS_ON_OVERVIEW_PAGE = 3;

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
    },

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

        this.parent(props);

        WebkitURIHandlers.register_webkit_uri_handlers();

        this._check_for_issue_update();

        this._parse_app_info(app_json);

        // Load all articles in this issue
        this._load_all_content();

        // Connect signals
        this.view.nav_buttons.connect('back-clicked', function () {
            this._shift_page(-1);
            this.settings.bookmark_page--;
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            this._shift_page(1);
            this.settings.bookmark_page++;
        }.bind(this));
        this.view.connect('notify::current-page',
            this._update_forward_button_visibility.bind(this));
        this.view.connect('notify::total-pages',
            this._update_forward_button_visibility.bind(this));
        this.view.issue_nav_buttons.back_button.connect('clicked', function () {
            this.settings.bookmark_issue--;
        }.bind(this));
        this.view.issue_nav_buttons.forward_button.connect('clicked', function () {
            this.settings.bookmark_issue++;
        }.bind(this));
        this.settings.connect('notify::bookmark-issue', this._load_all_content.bind(this));
        let handler = this.view.connect('debug-hotkey-pressed', function () {
            this.view.issue_nav_buttons.show();
            this.view.disconnect(handler);  // One-shot signal handler only.
        }.bind(this));

        //Bind properties
        this.view.bind_property('current-page', this.view.nav_buttons,
            'back-visible', GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
        this.settings.bind_property('bookmark-issue',
            this.view.issue_nav_buttons.back_button, 'sensitive',
            GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
    },

    // Right now these functions are just stubs which we will need to flesh out
    // if we ever want to register search providers for the reader apps. The
    // former will be called by ekn-app-runner if the user asks to view a search
    // query within an application, and the latter if the user asks to view a
    // specific article.
    search: function (query) {},
    activate_search_result: function (model, query) {},

    _check_for_issue_update: function() {
        if (Date.now() - this.settings.update_timestamp >= UPDATE_INTERVAL_MS) {
            this._update_issue();
        }
    },

    _update_issue: function () {
        this.settings.update_timestamp = Date.now();
        this.settings.bookmark_page = 0;
        this.settings.bookmark_issue++;
    },

    _load_all_content: function () {
        this.engine.get_objects_by_query({
            tag: 'issueNumber' + this.settings.bookmark_issue,
            limit: RESULTS_SIZE,
            sortBy: 'articleNumber',
            order: 'asc',
        }, function (error, results, get_more_results_func) {
            // Clear out state from any issue that was already displaying.
            this._article_models = [];
            this.view.remove_all_article_pages();
            // Make sure to drop all references to any webviews we are holding.
            if (this._current_page) {
                this._current_page.destroy();
                this._current_page = null;
            }
            if (this._next_page) {
                this._next_page.destroy();
                this._next_page = null;
            }
            if (this._previous_page) {
                this._previous_page.destroy();
                this._previous_page = null;
            }

            if (error !== undefined || results.length < 1) {
                if (error !== undefined) {
                    printerr(error);
                    printerr(error.stack);
                }
                let err_label = this._create_error_label(_("Oops!"),
                    _("We could not find this issue of your magazine!\nPlease try again after restarting your computer."));
                this.view.page_manager.add(err_label);
                this.view.page_manager.visible_child = err_label;
                this.view.show_all();
            } else {
                this._fetch_content_recursive(undefined, results, get_more_results_func);
            }
        }.bind(this));
    },

    // FIXME: We're breaking the ability to show content as soon as possible!
    // Under this implementation, you have to wait for metadata for all articles
    // in an issue to be fetched before seeing content for the article you were on
    _initialize_first_pages: function () {
        // The article number you are on is 1 less than the bookmarked page because we have the overview page
        // in the beginning
        let current_article = this.settings.bookmark_page - 1;
        if (current_article >= 0 && current_article < this._article_models.length) {
            this._current_page = this._load_webview_content(this._article_models[current_article], function (view, error) {
                this._load_webview_content_callback(this.view.get_article_page(current_article), view, error);
            }.bind(this));
        }

            // Load the next page if needed
        if (current_article + 1 < this._article_models.length) {
            let next_page = this.view.get_article_page(current_article + 1);
            this._next_page = this._load_webview_content(this._article_models[current_article + 1], function (view, error) {
                this._load_webview_content_callback(next_page, view, error);
            }.bind(this));
        }

        // Likewise, load the previous page if needed
        if (current_article > 0) {
            let previous_page = this.view.get_article_page(current_article - 1);
            this._previous_page = this._load_webview_content(this._article_models[current_article - 1], function (view, error) {
                this._load_webview_content_callback(previous_page, view, error);
            }.bind(this));
        }

        this.view.current_page = this.settings.bookmark_page;
        this._update_forward_button_visibility();

        this.view.show_all();
    },

    _fetch_content_recursive: function (err, results, get_more_results_func) {
        if (err !== undefined) {
            printerr(err);
            printerr(err.stack);
        } else {
            this._create_pages_from_models(results);
            // If there are more results to get, then fetch more content
            if (results.length >= RESULTS_SIZE) {
                get_more_results_func(RESULTS_SIZE, this._fetch_content_recursive.bind(this));
            } else {
                // We now have all the articles for this issue. Now we load the HTML content
                // for the first few pages into the webview
                this._load_overview_snippets_from_articles();
                this._initialize_first_pages();
            }
        }
    },

    // Presenter logic to move the reader either forward or backwards one page.
    // Current page is updated, the next page is loaded, and the previous one
    // is deleted. This ensures we maintain the invariant that the current,
    // previous, and next page are all loaded, but no other ones are, in order
    // to minimize memory usage.
    // Possible values for <delta> are +1 (to move foward) or -1 (to move backwards)
    _shift_page: function (delta) {
        if (delta !== -1 && delta !== 1)
            throw new Error("Invalid input value for this function: " + delta);
        let current_article = this.view.current_page - 1;
        let to_delete_index = current_article - delta;
        this.view.current_page += delta;
        let to_load_index = current_article + delta;
        let next_model_to_load = this._article_models[to_load_index];
        if (next_model_to_load !== undefined) {
            let next_page_to_load = this.view.get_article_page(to_load_index);
            this._next_page = this._load_webview_content(next_model_to_load, function (view, error) {
                this._load_webview_content_callback(next_page_to_load, view, error);
            }.bind(this));
        }
        let to_delete_page = this.view.get_article_page(to_delete_index);
        if (to_delete_page !== undefined) {
            to_delete_page.clear_content();
        }
    },

    // First article data has been loaded asynchronously; now we can start
    // loading its content, and show the window. Until this point the user will
    // have seen the loading splash screen. Also start loading the rest of the
    // pages, asynchronously.
    _create_pages_from_models: function (models) {
        models.forEach(function (model) {
            let page = this._create_article_page_from_article_model(model);
            this.view.append_article_page(page);
            this._update_forward_button_visibility();
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
        // FIXME: this is just to get something on screen. We need to redo all the jade templating.
        webview.load_html(article_model.body_html, article_model.ekn_id);
        return webview;
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

    _update_forward_button_visibility: function () {
        this.view.nav_buttons.forward_visible = (this.view.current_page !== this.view.total_pages - 1);
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
        return article_page;
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
        let snippets = this._article_models.slice(0, NUM_SNIPPETS_ON_OVERVIEW_PAGE).map(function (snippet) {
            return {
                "title": snippet.title,
                "synopsis": snippet.synopsis
            };
        });
        this.view.overview_page.set_article_snippets(snippets);
    },
});
