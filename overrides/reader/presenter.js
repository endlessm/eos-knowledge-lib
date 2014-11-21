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
const Utils = imports.utils;
const Window = imports.reader.window;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;

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
         * Property: issue-number
         * Current issue number
         *
         * Magazine issue that the user is currently reading in the view.
         * The number is zero-based, that is, 0 means the first issue.
         *
         * Default value:
         *  0
         */
        'issue-number': GObject.ParamSpec.uint('issue-number', 'Issue number',
            'Current issue number',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT64, 0),
    },

    _init: function (app_json, props) {
        let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        props.view = props.view || new Window.Window({
            application: props.application,
        });
        props.engine = props.engine || new EosKnowledgeSearch.Engine();

        // FIXME: this should be fetching the right issue number based on
        // today's date?
        this._issue_number = 0;

        this.parent(props);

        this._parse_app_info(app_json);

        // Load all articles in this issue
        this._load_all_content()
        this.view.done_page.get_style_context().add_class('last-page');
        this.view.done_page.background_image_uri = this._background_section_uri;

        // Connect signals
        this.view.nav_buttons.connect('back-clicked', function () {
            this._shift_page(-1);
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            this._shift_page(1);
        }.bind(this));
        this.view.connect('notify::current-page',
            this._update_forward_button_visibility.bind(this));
        this.view.connect('notify::total-pages',
            this._update_forward_button_visibility.bind(this));
        this.view.issue_nav_buttons.back_button.connect('clicked', function () {
            this.issue_number--;
        }.bind(this));
        this.view.issue_nav_buttons.forward_button.connect('clicked', function () {
            this.issue_number++;
        }.bind(this));
        this.connect('notify::issue-number', this._load_all_content.bind(this));
        let handler = this.view.connect('debug-hotkey-pressed', function () {
            this.view.issue_nav_buttons.show();
            this.view.disconnect(handler);  // One-shot signal handler only.
        }.bind(this));

        //Bind properties
        this.view.bind_property('current-page', this.view.nav_buttons,
            'back-visible', GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('issue-number',
            this.view.issue_nav_buttons.back_button, 'sensitive',
            GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
    },

    get issue_number() {
        return this._issue_number;
    },

    set issue_number(value) {
        if (value !== this._issue_number) {
            this._issue_number = value;
            this.notify('issue-number');
        }
    },

    // Right now these functions are just stubs which we will need to flesh out
    // if we ever want to register search providers for the reader apps. The
    // former will be called by ekn-app-runner if the user asks to view a search
    // query within an application, and the latter if the user asks to view a
    // specific article.
    search: function (query) {},
    activate_search_result: function (model, query) {},

    _load_all_content: function () {
        this.engine.get_objects_by_query(this._domain, {
            tag: 'issueNumber' + this.issue_number,
            limit: RESULTS_SIZE,
            sortBy: 'articleNumber',
            order: 'asc',
        }, function (error, results, get_more_results_func) {
            // Clear out state from any issue that was already displaying.
            this._article_models = [];
            this.view.remove_all_article_pages();
            // Make sure to drop all references to any webviews we are holding.
            if (this._first_page) {
                this._first_page.destroy();
                this._first_page = null;
            }
            if (this._next_page) {
                this._next_page.destroy();
                this._next_page = null;
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

                this._first_page = this._load_webview_content(this._article_models[0].ekn_id, function (view, error) {
                    this._load_webview_content_callback(this.view.get_article_page(0), view, error);
                }.bind(this));

                // If we have at least two articles total, load the next article in sequence
                if (this._article_models.length >= 2) {
                    let next_page = this.view.get_article_page(1);
                    this._next_page = this._load_webview_content(this._article_models[1].ekn_id, function (view, error) {
                        this._load_webview_content_callback(next_page, view, error);
                    }.bind(this));
                }

                this.view.current_page = 0;
                this.view.nav_buttons.back_visible = false;

                this.view.show_all();
            }
        }.bind(this));
    },

    _fetch_content_recursive: function (err, results, get_more_results_func) {
        if (err !== undefined) {
            printerr(error);
            printerr(error.stack);
        } else {
            this._create_pages_from_models(results);
            // If there are more results to get, then fetch more content
            if (results.length >= RESULTS_SIZE) {
                get_more_results_func(RESULTS_SIZE, this._fetch_content_recursive.bind(this));
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
        let to_delete_index = this.view.current_page - delta;
        this.view.current_page += delta;
        let to_load_index = this.view.current_page + delta
        let next_model_to_load = this._article_models[to_load_index];
        if (next_model_to_load !== undefined) {
            let next_page_to_load = this.view.get_article_page(to_load_index);
            this._next_page = this._load_webview_content(next_model_to_load.ekn_id, function (view, error) {
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

    _load_webview_content: function (uri, ready) {
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
        webview.load_uri(uri);
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
        this._domain = info['appId'].split('.').pop();
        this.view.title = info['appTitle'];
        this._background_section_uri = info['backgroundSectionURI'];
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
        err_label.show();
        return err_label;
    },
});
