// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StandalonePage = imports.app.reader.standalonePage;
const DonePage = imports.app.reader.donePage;
const Lightbox = imports.app.lightbox;
const NavButtonOverlay = imports.app.navButtonOverlay;
const OverviewPage = imports.app.reader.overviewPage;
const SearchResultsPage = imports.app.reader.searchResultsPage;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: Reader.Window
 * The window of the reader app.
 *
 * This class has the API to add, modify, and display article and done pages.
 * It adds to and removes from a private array of articlePages and
 * it updates the progressLabels on all of these pages according to which
 * page is being displayed.
 *
 * Adds a lightbox above the article page, which can be used to show content
 * above it.
 */
const Window = new Lang.Class({
    Name: 'Window',
    GTypeName: 'EknReaderWindow',
    Extends: Endless.Window,
    Properties: {
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: nav-buttons
         *
         * The <NavButtonOverlay> widget created by the window. This property
         * allows the presenter to connect to signals emitted by the buttons.
         * Read-only.
         */
        'nav-buttons': GObject.ParamSpec.object('nav-buttons', 'Nav Buttons',
            'The nav buttons of the window.',
            GObject.ParamFlags.READABLE, NavButtonOverlay.NavButtonOverlay.$gtype),

        /**
         * Property: overview-page
         *
         * The <Reader.OverviewPage> widget created by this widget. Read-only.
         */
        'overview-page': GObject.ParamSpec.object('overview-page', 'Overview Page',
            'The splash page that appears when the app starts.',
            GObject.ParamFlags.READABLE,
            OverviewPage.OverviewPage.$gtype),

        /**
         * Property: done-page
         *
         * The <Reader.DonePage> widget created by this widget. Read-only.
         */
        'done-page': GObject.ParamSpec.object('done-page', 'Done Page',
            'The done page at the end of the app.',
            GObject.ParamFlags.READABLE,
            DonePage.DonePage.$gtype),

        /**
         * Property: standalone-page
         *
         * The <Reader.StandalonePage> widget created by this widget in order to
         * show a standalone search result from the archive.
         * Read-only.
         */
        'standalone-page': GObject.ParamSpec.object('standalone-page',
            'Standalone page', 'The page that shows a single article',
            GObject.ParamFlags.READABLE,
            StandalonePage.StandalonePage.$gtype),

        /**
         * Property: search-results-page
         *
         * The <Reader.SearchResultsPage> widget created by this widget. Read-only.
         */
        'search-results-page': GObject.ParamSpec.object('search-results-page',
            'Search Results Page', 'The page that show the results of a search',
            GObject.ParamFlags.READABLE,
            SearchResultsPage.SearchResultsPage.$gtype),

        /**
         * Property: issue-nav-buttons
         *
         * An <Endless.TopbarNavButton> widget created by this window.
         * Not normally shown except for debugging purposes.
         * Read-only.
         */
        'issue-nav-buttons': GObject.ParamSpec.object('issue-nav-buttons',
            'Issue nav buttons', 'Secret buttons for navigating issues',
            GObject.ParamFlags.READABLE,
            Endless.TopbarNavButton.$gtype),

        /**
         * Property: history-buttons
         *
         * An <Endless.TopbarNavButton> widget created by this window.
         * Used to go back and forward in the history model.
         * Read-only.
         */
        'history-buttons': GObject.ParamSpec.object('history-buttons',
            'History nav buttons', 'For traversing history model',
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
            Lightbox.Lightbox.$gtype),

        /**
         * Property: total-pages
         *
         * The total number of pages.
         */
        'total-pages': GObject.ParamSpec.uint('total-pages', 'Total pages',
            'Number of pages in total',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXUINT32, 1),

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
    },

    Signals: {
        'debug-hotkey-pressed': {},

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

    _STACK_TRANSITION_TIME: 500,
    _BACK_IMAGE_URI: 'resource:///com/endlessm/knowledge/images/reader/left-arrow.svg',
    _FORWARD_IMAGE_URI: 'resource:///com/endlessm/knowledge/images/reader/right-arrow.svg',
    _NAV_IMAGE_SIZE: 23,

    _init: function (props) {
        props = props || {};
        this.parent(props);

        this.overview_page = new OverviewPage.OverviewPage({
            factory: this.factory,
        });
        this.done_page = new DonePage.DonePage();
        this.standalone_page = new StandalonePage.StandalonePage();
        this.search_results_page = new SearchResultsPage.SearchResultsPage();
        this.nav_buttons = new NavButtonOverlay.NavButtonOverlay({
            back_image_uri: this._BACK_IMAGE_URI,
            forward_image_uri: this._FORWARD_IMAGE_URI,
            image_size: this._NAV_IMAGE_SIZE,
        });

        this.issue_nav_buttons = new Endless.TopbarNavButton({
            no_show_all: true,
        });

        this.history_buttons = new Endless.TopbarNavButton();
        // No need for localization; this is debug only
        this.issue_nav_buttons.back_button.label = 'Reset';
        this.issue_nav_buttons.forward_button.label = 'Next week';

        this.lightbox = new Lightbox.Lightbox();
        this.lightbox.connect('navigation-previous-clicked', function (lightbox) {
            this.emit('lightbox-nav-previous-clicked', lightbox);
        }.bind(this));
        this.lightbox.connect('navigation-next-clicked', function (lightbox) {
            this.emit('lightbox-nav-next-clicked', lightbox);
        }.bind(this));

        this._article_pages = [];

        this._debug_hotkey_action = new Gio.SimpleAction({
            name: 'debug-mode',
        });
        this.application.add_action(this._debug_hotkey_action);
        this.application.add_accelerator('<Control><Shift>B', 'app.debug-mode', null);
        this._debug_hotkey_action.connect('activate', function () {
            this.emit('debug-hotkey-pressed');
        }.bind(this));

        this.search_box = this.factory.create_named_module('top-bar-search');

        this._stack = new Gtk.Stack({
            transition_duration: this._STACK_TRANSITION_TIME,
        });
        this._stack.add(this.overview_page);
        this._stack.add(this.done_page);
        this._stack.add(this.standalone_page);
        this._stack.add(this.search_results_page);
        this.nav_buttons.add(this._stack);
        this.lightbox.add(this.nav_buttons);

        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
        });
        box.add(this.search_box);
        // Stick the debug nav buttons in a box with the search bar.
        // Looks a bit ugly but only used for debugging.
        box.add(this.issue_nav_buttons);

        this.page_manager.add(this.lightbox, {
            left_topbar_widget: this.history_buttons,
            center_topbar_widget: box,
        });
        this.overview_page.show_all();
        this._stack.set_visible_child(this.overview_page);

        this._stack.connect('notify::transition-running', () => {
            if (this._stack.transition_running) {
                this.get_style_context().add_class(StyleClasses.ANIMATING);
            } else {
                this.get_style_context().remove_class(StyleClasses.ANIMATING);
            }
        });
    },

    _update_progress_labels: function () {
        for (let i = 0; i < this._article_pages.length; i++) {
            // Account for overview and done pages
            this._article_pages[i].progress_label.current_page = i + 2;
            this._article_pages[i].progress_label.total_pages = this.total_pages;
        }
        this.done_page.progress_label.current_page = this.total_pages;
        this.done_page.progress_label.total_pages = this.total_pages;
    },

    /*
     *  Method: append_article_page
     *
     *  Appends an article page to the widget's array of article pages.
     */
    append_article_page: function (article_page) {
        article_page.show_all();
        if (!(article_page in this._article_pages)) {
            this._article_pages.push(article_page);
        }
        this._stack.add(article_page);
        this._update_progress_labels();
    },

    /*
     *  Method: remove_article_page
     *
     *  Removes the specified article from widget's array of article pages.
     */
    remove_article_page: function (article_page) {
        let index = this._article_pages.indexOf(article_page);
        if (index > -1) {
            this._article_pages.splice(index, 1);
            this._stack.remove(article_page);
        }
        this._update_progress_labels();
    },

    get_article_page: function (index) {
        return this._article_pages[index];
    },

    /**
     * Method: remove_all_article_pages
     * Clear the view entirely of articles
     */
    remove_all_article_pages: function () {
        let pages = this._article_pages.slice();
        pages.forEach(this.remove_article_page, this);
    },

    _show_standalone_page: function () {
        this.standalone_page.show();
        this._stack.set_transition_type(Gtk.StackTransitionType.NONE);
        this._stack.set_visible_child(this.standalone_page);
        this.nav_buttons.back_visible = false;
        this.nav_buttons.forward_visible = false;
    },

    show_global_search_standalone_page: function () {
        this.standalone_page.archive_notice.hide();
        this.standalone_page.infobar.show();
        this._show_standalone_page();
    },

    show_in_app_standalone_page: function () {
        this.standalone_page.archive_notice.show();
        this.standalone_page.infobar.hide();
        this._show_standalone_page();
    },

    show_search_results_page: function () {
        this._stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        this._stack.set_visible_child(this.search_results_page);
        this.nav_buttons.back_visible = false;
        this.nav_buttons.forward_visible = false;
    },

    show_article_page: function (index, animation_type) {
        this.nav_buttons.accommodate_scrollbar = true;
        this._set_stack_transition(animation_type);
        let page = this._article_pages[index];
        page.show();
        this._stack.set_visible_child(page);
    },

    show_overview_page: function (animation_type) {
        this.nav_buttons.accommodate_scrollbar = false;
        this._set_stack_transition(animation_type);
        this.overview_page.show();
        this._stack.set_visible_child(this.overview_page);
    },

    show_done_page: function (animation_type) {
        this.nav_buttons.accommodate_scrollbar = false;
        this._set_stack_transition(animation_type);
        this.done_page.show();
        this._stack.set_visible_child(this.done_page);
    },

    _set_stack_transition: function (animation_type) {
        if (animation_type === EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION) {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT);
        } else if (animation_type === EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION) {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT);
        } else {
            this._stack.set_transition_type(Gtk.StackTransitionType.NONE);
        }
    },

    article_pages_visible: function () {
        return this._stack.get_visible_child() !== this.search_results_page
            && this._stack.get_visible_child() !== this.standalone_page;
    },

    get total_pages() {
        // Done page and overview page account for extra incrementation.
        return this._article_pages.length + 2;
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
    },
});
