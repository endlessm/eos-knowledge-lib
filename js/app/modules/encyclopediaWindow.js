const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentPage = imports.app.encyclopedia.contentPage;
const HomePage = imports.app.encyclopedia.homePage;
const Lightbox = imports.app.widgets.lightbox;
const Module = imports.app.interfaces.module;

const HOME_PAGE_NAME = 'home';
const CONTENT_PAGE_NAME = 'content';

const EncyclopediaWindow = new Lang.Class({
    Name: 'EncyclopediaWindow',
    Extends: Endless.Window,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'home-page': GObject.ParamSpec.object('home-page', 'home page',
            'The home page of this view widget.',
            GObject.ParamFlags.READABLE,
            HomePage.HomePage),
        'content-page': GObject.ParamSpec.object('content-page', 'Content page',
            'The content page of this view widget.',
            GObject.ParamFlags.READABLE,
            ContentPage.ContentPage),
        'history-buttons': GObject.ParamSpec.object('history-buttons',
            'History buttons',
            'The back/forward navigation buttons on the title bar',
            GObject.ParamFlags.READABLE,
            Endless.TopbarNavButton.$gtype),
        /**
         * Property: lightbox
         *
         * The <Lightbox> widget created by this widget. Read-only,
         * modify using the <Lightbox> API. Use to show content above the <section-page>
         * or <article-page>.
         */
        'lightbox': GObject.ParamSpec.object('lightbox', 'Lightbox',
            'The lightbox of this view widget.',
            GObject.ParamFlags.READABLE,
            Lightbox.Lightbox),
        /**
         * Property: home-background-uri
         * URI of the home page background
         */
        'home-background-uri': GObject.ParamSpec.string('home-background-uri',
            'Home Background URI', 'Home Background URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: results-background-uri
         * URI of the results page background
         */
        'results-background-uri': GObject.ParamSpec.string('results-background-uri',
            'Results Background URI', 'Results Background URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    Signals: {
        /**
         * Event: lightbox-nav-previous-clicked
         * Emmited when the navigation button in the lightbox is clicked. Passes
         * the media object currently displayed by the lightbox.
         */
        'lightbox-nav-previous-clicked': {
            param_types: [GObject.TYPE_OBJECT],
        },

        /**
         * Event: lightbox-nav-next-clicked
         * Emmited when the navigation button in the lightbox is clicked. Passes
         * the media object currently displayed by the lightbox.
         */
        'lightbox-nav-next-clicked': {
            param_types: [GObject.TYPE_OBJECT],
        },
    },

    _init: function (props) {
        props = props || {};
        props.font_scaling_active = true;
        this.parent(props);

        let context = this.get_style_context();
        context.add_class(HOME_PAGE_NAME);

        this._home_page = new HomePage.HomePage({
            factory: this.factory,
        });
        this._content_page = new ContentPage.ContentPage({
            factory: this.factory,
        });
        this.history_buttons = new Endless.TopbarNavButton();
        this.history_buttons.show_all();

        this.page_manager.transition_duration = 200;  // ms

        this.page_manager.add(this._home_page, {
            name: HOME_PAGE_NAME,
            background_uri: this.home_background_uri,
            background_repeats: false,
            background_size: 'cover',
            background_position: 'center center'
        });

        this._lightbox = new Lightbox.Lightbox();
        this._lightbox.connect('navigation-previous-clicked', (lightbox) =>
            this.emit('lightbox-nav-previous-clicked', lightbox));
        this._lightbox.connect('navigation-next-clicked', (lightbox) =>
            this.emit('lightbox-nav-next-clicked', lightbox));
        this._lightbox.add(this._content_page);

        this.page_manager.add(this._lightbox, {
            name: CONTENT_PAGE_NAME,
            left_topbar_widget: this.history_buttons,
            background_uri: this.results_background_uri,
            background_repeats: false,
            background_size: 'cover',
            background_position: 'top center'
        });
        this.show_all();
    },

    get home_page () {
        return this._home_page;
    },

    get content_page () {
        return this._content_page;
    },

    get_visible_page: function () {
        if (this.page_manager.visible_child_name === CONTENT_PAGE_NAME) {
            return this._lightbox;
        } else {
            return this._home_page;
        }
    },

    get lightbox () {
        return this._lightbox;
    },

    show_content_page: function () {
        this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        this.page_manager.visible_child_name = CONTENT_PAGE_NAME;
    },

    show_home_page: function () {
        this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        this.page_manager.visible_child_name = HOME_PAGE_NAME;
    },

    _onArticleBackClicked: function (button) {
        this._content_page.go_back();
    }
});
