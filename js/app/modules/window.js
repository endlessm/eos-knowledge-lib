// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GdkPixbuf = imports.gi.GdkPixbuf;
const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArticlePage = imports.app.articlePage;
const CategoriesPage = imports.app.categoriesPage;
const Dispatcher = imports.app.dispatcher;
const HomePage = imports.app.homePage;
const HomePageA = imports.app.homePageA;
const Lightbox = imports.app.widgets.lightbox;
const Module = imports.app.interfaces.module;
const NavButtonOverlay = imports.app.widgets.navButtonOverlay;
const NoSearchResultsPage = imports.app.noSearchResultsPage;
const SearchPage = imports.app.searchPage;
const SectionPage = imports.app.sectionPage;
const SectionPageA = imports.app.sectionPageA;
const SectionPageB = imports.app.sectionPageB;
const StyleClasses = imports.app.styleClasses;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Defines how much the background slides when switching pages, and
 * therefore also how zoomed in the background image is from its
 * original size.
 */
const PARALLAX_BACKGROUND_SCALE = 1.1;

/**
 * Class: Window
 *
 * This represents the toplevel window widget for template A, containing all
 * template A pages.
 *
 * Adds a lightbox above the section and article page, which can be
 * used to show content above either of these pages.
 */
const Window = new Lang.Class({
    Name: 'Window',
    GTypeName: 'EknWindow',
    Extends: Endless.Window,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: home-page
         *
         * The <HomePageA> widget created by this widget. Read-only,
         * modify using the <HomePageA> API.
         */
        'home-page': GObject.ParamSpec.object('home-page', 'Home page',
            'The home page of this view widget.',
            GObject.ParamFlags.READABLE,
            HomePage.HomePage),
        /**
         * Property: categories-page
         *
         * The <CategoriesPage> widget created by this widget. Read-only,
         * modify using the <CategoriesPage> API.
         */
        'categories-page': GObject.ParamSpec.object('categories-page', 'Categories page',
            'The categories page of this view widget.',
            GObject.ParamFlags.READABLE,
            CategoriesPage.CategoriesPage),
        /**
         * Property: section-page
         *
         * The <SectionPageA> widget created by this widget. Read-only,
         * modify using the <SectionPageA> API.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section page',
            'The section page of this view widget.',
            GObject.ParamFlags.READABLE,
            SectionPage.SectionPage),
        /**
         * Property: article-page
         *
         * The <ArticlePage> widget created by this widget. Read-only,
         * modify using the <ArticlePage> API.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article page',
            'The article page of this view widget.',
            GObject.ParamFlags.READABLE,
            ArticlePage.ArticlePage),
        /**
         * Property: search-page
         *
         * The <SearchPage> widget created by this widget. Read-only,
         * modify using the <SearchPage> API.
         */
        'search-page': GObject.ParamSpec.object('search-page', 'Search page',
            'The search page of this view widget.',
            GObject.ParamFlags.READABLE,
            SearchPage.SearchPage),
        /**
         * Property: no-search-results-page
         *
         * The <NoSearchResultsPage> widget created by this widget. Read-only,
         * modify using the <NoSearchResultsPage> API.
         */
        'no-search-results-page': GObject.ParamSpec.object('no-search-results-page', 'No Search Results page',
            'A message page that is displayed when no search results are found.',
            GObject.ParamFlags.READABLE,
            NoSearchResultsPage.NoSearchResultsPage),
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
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The Search box of this view widget',
            GObject.ParamFlags.READABLE,
            Endless.SearchBox),
        /**
         * Property: background-image-uri
         *
         * The background image uri for this window.
         * Gets set on home page of the application.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri', 'Background image URI',
            'The background image of this window.',
            GObject.ParamFlags.READWRITE,
            ''),
        /**
         * Property: blur-background-image-uri
         *
         * The blurred background image uri for this window.
         * Gets set on section and article pages of the application.
         */
        'blur-background-image-uri': GObject.ParamSpec.string('blur-background-image-uri', 'Blurred background image URI',
            'The blurred background image of this window.',
            GObject.ParamFlags.READWRITE,
            ''),
        /**
         * Property: template-type
         *
         * A string for the template type the window should render as
         * currently support 'A' and 'B' templates.
         */
        'template-type':  GObject.ParamSpec.string('template-type', 'Template Type',
            'Which template the window should display with',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, 'A'),
    },
    Signals: {
        /**
         * Event: article-selected
         *
         * This event is triggered when an article is selected from the autocomplete menu.
         */
        'article-selected': {
            param_types: [GObject.TYPE_STRING]
        },
        /**
         * Event: search-entered
         *
         * This event is triggered when the user activates a search.
         */
        'search-entered': {
            param_types: [GObject.TYPE_STRING]
        },
        /**
         * Event: search-focused
         *
         * This event is triggered when the user focuses the search bar.
         */
        'search-focused': {
            param_types: [GObject.TYPE_BOOLEAN]
        },
        /**
         * Event: search-text-changed
         *
         * This event is triggered when the text in the top bar search box changed.
         */
        'search-text-changed': {
            param_types: [GObject.TYPE_OBJECT]
        },
    },

    TRANSITION_DURATION: 500,

    _init: function (props) {
        this.parent(props);

        this._categories_page = new CategoriesPage.CategoriesPage();
        if (this.template_type === 'B') {
            this._home_page = this.factory.create_named_module('home-page-template');
            this._section_page = new SectionPageB.SectionPageB({
                factory: this.factory,
            });
            this._search_page = new SearchPage.SearchPageB({
                factory: this.factory,
            });
            this._article_page = new ArticlePage.ArticlePage();
            this._no_search_results_page = new NoSearchResultsPage.NoSearchResultsPageB();
        } else {
            this._home_page = new HomePageA.HomePageA({
                factory: this.factory,
            });
            this._section_page = new SectionPageA.SectionPageA({
                factory: this.factory,
            });
            this._search_page = new SearchPage.SearchPageA({
                factory: this.factory,
            });
            this._article_page = new ArticlePage.ArticlePage();
            this._no_search_results_page = new NoSearchResultsPage.NoSearchResultsPageA();
        }

        this._stack = new Gtk.Stack();
        this._stack.add(this._home_page);
        this._stack.add(this._categories_page);
        this._stack.add(this._section_page);
        this._stack.add(this._search_page);
        this._stack.add(this._no_search_results_page);
        this._stack.add(this._article_page);

        this._nav_buttons = new NavButtonOverlay.NavButtonOverlay({
            back_visible: false,
            forward_visible: false,
        });
        this._nav_buttons.add(this._stack);

        this._lightbox = new Lightbox.Lightbox();
        this._lightbox.add(this._nav_buttons);

        this._history_buttons = new Endless.TopbarNavButton();
        this.search_box = this.factory.create_named_module('top-bar-search', {
            no_show_all: true,
            visible: false,
        });
        this.page_manager.add(this._lightbox, {
            left_topbar_widget: this._history_buttons,
            center_topbar_widget: this.search_box,
        });

        let dispatcher = Dispatcher.get_default();
        this._nav_buttons.connect('back-clicked', () => {
            dispatcher.dispatch({ action_type: Actions.NAV_BACK_CLICKED });
        });
        this._history_buttons.back_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        });
        this._history_buttons.forward_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        });

        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_ENABLED_CHANGED:
                    this._history_buttons.back_button.sensitive = payload.enabled;
                    break;
                case Actions.HISTORY_FORWARD_ENABLED_CHANGED:
                    this._history_buttons.forward_button.sensitive = payload.enabled;
                    break;
            }
        });

        this._history_buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        this._history_buttons.show_all();

        this.search_box.connect('notify::has-focus', function () {
            this.emit('search-focused', this.search_box.has_focus);
        }.bind(this));
        this.search_box.connect('text-changed', function (search_entry) {
            this.emit('search-text-changed', search_entry);
        }.bind(this));
        this.search_box.connect('activate', function (search_entry) {
            this.emit('search-entered', search_entry.text);
        }.bind(this));
        this.search_box.connect('menu-item-selected', function (search_entry, article_id) {
            this.emit('article-selected', article_id);
        }.bind(this));

        this._stack.transition_duration = this.TRANSITION_DURATION;
        this._stack.connect('notify::transition-running', function () {
            this.home_page.animating = this._stack.transition_running;
            this.categories_page.animating = this._stack.transition_running;
            let context = this.get_style_context();
            if (this._stack.transition_running)
                context.add_class(StyleClasses.ANIMATING);
            else
                context.remove_class(StyleClasses.ANIMATING);
        }.bind(this));
        this.connect('size-allocate', Lang.bind(this, function(widget, allocation) {
            let win_width = allocation.width;
            let win_height = allocation.height;
            if (this.background_image_uri &&
                (this._last_allocation === undefined ||
                (this._last_allocation.width !== win_width ||
                this._last_allocation.height !== win_height))) {
                let bg_mult_ratio = Math.max(win_width / this._background_image_width, win_height / this._background_image_height) * PARALLAX_BACKGROUND_SCALE;
                let bg_width = Math.ceil(this._background_image_width * bg_mult_ratio);
                let bg_height = Math.ceil(this._background_image_height * bg_mult_ratio);

                let frame_css = 'EknWindow { background-size: ' + bg_width + 'px ' + bg_height + 'px;}';
                let context = this.get_style_context();
                if (this._bg_size_provider === undefined) {
                    this._bg_size_provider = new Gtk.CssProvider();
                    context.add_provider(this._bg_size_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
                }
                this._bg_size_provider.load_from_data(frame_css);
            }
            this._last_allocation = { width: win_width, height: win_height };
        }));

        this.show_all();
        this._set_background_position_style(StyleClasses.BACKGROUND_LEFT);
    },

    get home_page () {
        return this._home_page;
    },

    get categories_page () {
        return this._categories_page;
    },

    get section_page () {
        return this._section_page;
    },

    get article_page () {
        return this._article_page;
    },

    get search_page () {
        return this._search_page;
    },

    get no_search_results_page () {
        return this._no_search_results_page;
    },

    get lightbox () {
        return this._lightbox;
    },

    get background_image_uri () {
        return this._background_image_uri;
    },

    set background_image_uri (v) {
        if (this._background_image_uri === v) {
            return;
        }
        this._background_image_uri = v;
        if (this._background_image_uri !== null) {
            let frame_css = 'EknWindow.background-left { background-image: url("' + this._background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

            let bg_image_pixbuf;
            if (this._background_image_uri.indexOf("file://") === 0) {
                let filePath = this._background_image_uri.split("file://")[1];
                bg_image_pixbuf = GdkPixbuf.Pixbuf.new_from_file(filePath);
            } else if (this._background_image_uri.indexOf("resource://") === 0) {
                let resource = this._background_image_uri.split("resource://")[1];
                bg_image_pixbuf = GdkPixbuf.Pixbuf.new_from_resource(resource);
            } else {
                printerr("Error: background image URI is not a valid format.");
            }

            if (bg_image_pixbuf !== undefined) {
                this._background_image_width = bg_image_pixbuf.width;
                this._background_image_height = bg_image_pixbuf.height;
            }
        }
    },

    get blur_background_image_uri () {
        return this._blur_background_image_uri;
    },

    set blur_background_image_uri (v) {
        if (this._blur_background_image_uri === v) {
            return;
        }
        this._blur_background_image_uri = v;
        if (this._blur_background_image_uri !== null) {
            let frame_css = 'EknWindow.background-center, EknWindow.background-right { background-image: url("' + this._blur_background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
    },

    _set_background_position_style: function (klass) {
        this.get_style_context().remove_class(StyleClasses.BACKGROUND_LEFT);
        this.get_style_context().remove_class(StyleClasses.BACKGROUND_CENTER);
        this.get_style_context().remove_class(StyleClasses.BACKGROUND_RIGHT);
        this.get_style_context().add_class(klass);
    },

    /**
     * Method: show_page
     */
    show_page: function (new_page) {
        let old_page = this.get_visible_page();
        if (old_page === new_page)
            return;

        let is_on_left = (page) => page === this.home_page || page === this.categories_page;
        let is_on_center = (page) => page === this.section_page || page === this.search_page || page === this.no_search_results_page;
        if (is_on_left(new_page)) {
            if (old_page === this.home_page) {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_UP;
            } else if (old_page === this.categories_page) {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            }
            this._nav_buttons.back_visible = false;
            this.search_box.visible = false;
            this._set_background_position_style(StyleClasses.BACKGROUND_LEFT);
        } else if (is_on_center(new_page)) {
            if (is_on_left(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            } else if (is_on_center(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            }
            this._nav_buttons.back_visible = true;
            this.search_box.visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_CENTER);
        } else {
            this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            this._nav_buttons.back_visible = true;
            this.search_box.visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_RIGHT);
        }
        this._stack.visible_child = new_page;
    },

    /**
     * Method: get_visible_page
     *
     * Returns the currently visible page, either the home, section or article page.
     */
    get_visible_page: function () {
        return this._stack.visible_child;
    },

    lock_ui: function () {
        let gdk_window = this.page_manager.get_window();
        gdk_window.cursor = Gdk.Cursor.new(Gdk.CursorType.WATCH);
        this.page_manager.sensitive = false;
    },

    unlock_ui: function () {
        let gdk_window = this.page_manager.get_window();
        gdk_window.cursor = Gdk.Cursor.new(Gdk.CursorType.ARROW);
        this.page_manager.sensitive = true;
    }
});
