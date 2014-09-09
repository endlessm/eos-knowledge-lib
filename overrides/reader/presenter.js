const EosKnowledge = imports.gi.EosKnowledge;
const Format = imports.format;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticlePage = imports.reader.articlePage;
const Config = imports.config;
const EknWebview = imports.eknWebview;
const Engine = imports.engine;
const Window = imports.reader.window;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
         * Property: app-file
         * File handle pointing to the app.json file
         *
         * This property is usually set by <Reader.Application>.
         * Its usual value is the object:
         * > application.resource_file.get_child('app.json')
         *
         * Flags:
         *   Construct only
         */
        'app-file': GObject.ParamSpec.object('app-file', 'App file',
            'File handle pointing to the app.json file',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
            /* The above should be Gio.File.$gtype; properties with an interface
            type are broken until GJS 1.42 */
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
            Engine.Engine.$gtype),
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
            Window.Window.$gtype),
    },

    _init: function (props) {
        this.parent(props);

        let [success, contents] = this.app_file.load_contents(null);
        this._parse_app_info(JSON.parse(contents));

        // First we load only the first article of the issue, in order to get
        // something on the screen as quickly as possible. Once that is loaded,
        // we can start loading the subsequent articles.
        this.engine.get_objects_by_query(this._domain, {
            // FIXME: this should be the query that gets the first article of
            // the current issue
            tag: this._domain,
            limit: 1,
        }, this._create_first_page.bind(this));
        this.view.done_page.get_style_context().add_class('last-page');

        // Connect signals
        this.view.nav_buttons.connect('back-clicked', function () {
            this.view.current_page--;
        }.bind(this));
        this.view.nav_buttons.connect('forward-clicked', function () {
            this.view.current_page++;
        }.bind(this));
        this.view.connect('notify::current-page',
            this._update_forward_button_visibility.bind(this));
        this.view.connect('notify::total-pages',
            this._update_forward_button_visibility.bind(this));

        //Bind properties
        this.view.bind_property('current-page', this.view.nav_buttons,
            'back-visible', GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
    },

    // First article data has been loaded asynchronously; now we can start
    // loading its content, and show the window. Until this point the user will
    // have seen the loading splash screen. Also start loading the rest of the
    // pages, asynchronously.
    _create_first_page: function (error, result) {
        if (error !== undefined || result.length < 1) {
            let err_label = _create_error_label(_("Oops!"),
                _("We could not find this issue of your magazine!\nPlease try again after restarting your computer."));
            this.view.page_manager.add(err_label);
            this.view.page_manager.visible_child = err_label;
            this.view.show_all();
            return;
        }

        let page = _create_article_page_from_article_model(result[0]);
        _load_article_content_async(result[0], page);
        this.view.append_article_page(page);
        this.view.current_page = 0;
        this.view.nav_buttons.back_visible = false;

        // Start loading the following pages
        this.engine.get_objects_by_query(this._domain, {
            // FIXME: this should be the query that gets all the articles
            // belonging to the current issue
            tag: this._domain,
            limit: 15,
        }, this._create_following_pages.bind(this));

        this.view.show_all();
    },

    // The data about the rest of the pages from this issue has been loaded
    // asynchronously, so create those pages, add them to the view, and start
    // loading their content.
    _create_following_pages: function (error, result) {
        if (error !== undefined) {
            let err_label = _create_error_label(_("Oops!"),
                _("We thought there were more articles for you to see but we couldn't find them.\nPlease try again after restarting your computer."));
            try {
                this.view.append_article_page(err_label);
            } catch (e) {
                // Technically you're only supposed to append an
                // EosKnowledge.Reader.ArticlePage this way, so this will throw an
                // exception; but it should not happen anyway.
            }
            return;
        }

        // FIXME: We pop the first element, since it is already displayed as the
        // first page. We will remove this once we have pagination.
        result.shift();
        result.forEach(function (model) {
            let page = _create_article_page_from_article_model(model);
            _load_article_content_async(model, page);
            this.view.append_article_page(page);
            this._update_forward_button_visibility();
        }, this);
    },

    _update_forward_button_visibility: function () {
        this.view.nav_buttons.forward_visible = (this.view.current_page !== this.view.total_pages - 1);
    },

    // Retrieve all needed information from the app.json file, such as the app
    // ID and the app's headline.
    _parse_app_info: function (info) {
        this._domain = info['appId'].split('.').pop();
    },
});

// Take an ArticleObjectModel and create a Reader.ArticlePage view.
function _create_article_page_from_article_model(model) {
    let attribution_string = '';
    // FIXME: this is just a guess about what the metadata property will
    // look like.
    if (model.metadata) {
        let metadata = model.metadata;
        if ('author' in metadata && 'date' in metadata) {
            // TRANSLATORS: the %s's are replaced by the name of the author
            // and the date published, for example "by Ronaldo on Saturday,
            // September 5, 2014". Make sure to keep the %s's in the
            // translated string.
            attribution_string = _("by %s on %s").format(metadata['author'],
                // FIXME: must be nicely formatted according to locale
                metadata['date']);
        } else if ('author' in metadata) {
            // TRANSLATORS: the %s is replaced by the name of the author,
            // for example "by Ronaldo". Make sure to keep the %s in the
            // translated string.
            attribution_string = _("by %s").format(metadata['author']);
        } else if ('date' in metadata) {
            // FIXME: must be nicely formatted according to locale
            attribution_string = metadata['date'];
        }
    }

    return new ArticlePage.ArticlePage({
        title: model.title,
        attribution: attribution_string,
    });
}

// Start the webview loading the article's content.
function _load_article_content_async(model, page) {
    let webview = new EknWebview.EknWebview();
    webview.load_uri(model.ekn_id);
    let load_id = webview.connect('load-changed', function (view, event) {
        // failsafe: disconnect on load finished even if there was an error
        if (event === WebKit2.LoadEvent.FINISHED) {
            view.disconnect(load_id);
            return;
        }
        if (event === WebKit2.LoadEvent.COMMITTED) {
            page.show_content_view(view);
            view.disconnect(load_id);
            return;
        }
    });
    let fail_id = webview.connect('load-failed', function (view, event, failed_uri, error) {
        let err_page = _create_error_label(_("Oops!"),
            _("There was an error loading that page.\nTry another one or try again after restarting your computer."));
        page.show_content_view(err_page);
    });
}

// Show a friendlier error message when the engine is not working; suggest
// restarting the computer because that's the only thing under the user's
// control at this point that might get the knowledge engine back up. This is
// in order to prevent the "Message Corrupt" effect.
function _create_error_label(headline, message) {
    let err_label = new Gtk.Label({
        label: '<span size="xx-large"><b>' + headline + '</b></span>\n' + message,
        justify: Gtk.Justification.CENTER,
        use_markup: true,
    });
    err_label.show();
    return err_label;
}
