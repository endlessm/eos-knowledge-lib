// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const NavButtonOverlay = imports.app.widgets.navButtonOverlay;
const OverviewPage = imports.app.reader.overviewPage;
const SearchResultsPage = imports.app.reader.searchResultsPage;
const StandalonePage = imports.app.reader.standalonePage;
const StyleClasses = imports.app.styleClasses;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

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
const ReaderWindow = new Lang.Class({
    Name: 'ReaderWindow',
    GTypeName: 'EknReaderWindow',
    Extends: Endless.Window,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
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
         * Property: back-cover
         *
         * The <BackCover> widget created by this widget. Read-only.
         */
        'back-cover': GObject.ParamSpec.object('back-cover', 'Back cover',
            'The back cover at the end of the app.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),

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
         * Property: total-pages
         *
         * The total number of pages.
         */
        'total-pages': GObject.ParamSpec.uint('total-pages', 'Total pages',
            'Number of pages in total',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXUINT32, 1),
        /**
         * Property: home-background-uri
         * URI of the home page background
         */
        'home-background-uri': GObject.ParamSpec.string('home-background-uri',
            'Home Background URI', 'Home Background URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: title-image-uri
         *
         * FIXME: when the infobar is a proper module this can go away.
         */
        'title-image-uri': GObject.ParamSpec.string('title-image-uri',
            'Title Image URI', 'Title Image URI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    Signals: {
        'debug-hotkey-pressed': {},
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
        this.back_cover = this.factory.create_named_module('back-cover');
        this.standalone_page = new StandalonePage.StandalonePage();
        this.standalone_page.infobar.archive_notice.label = _("This article is part of the archive of the magazine %s.").format(this.title);
        this.standalone_page.infobar.title_image_uri = this.title_image_uri;
        this.standalone_page.infobar.background_image_uri = this.home_background_uri;
        this.search_results_page = new SearchResultsPage.SearchResultsPage();

        let dispatcher = Dispatcher.get_default();
        this.nav_buttons = new NavButtonOverlay.NavButtonOverlay({
            back_image_uri: this._BACK_IMAGE_URI,
            forward_image_uri: this._FORWARD_IMAGE_URI,
            image_size: this._NAV_IMAGE_SIZE,
        });
        this.nav_buttons.connect('back-clicked', () => {
            dispatcher.dispatch({ action_type: Actions.NAV_BACK_CLICKED });
        });
        this.nav_buttons.connect('forward-clicked', () => {
            dispatcher.dispatch({ action_type: Actions.NAV_FORWARD_CLICKED });
        });

        this.issue_nav_buttons = new Endless.TopbarNavButton({
            no_show_all: true,
        });

        this._history_buttons = new Endless.TopbarNavButton();
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

        // No need for localization; this is debug only
        this.issue_nav_buttons.back_button.label = 'Reset';
        this.issue_nav_buttons.forward_button.label = 'Next week';

        let lightbox = this.factory.create_named_module('lightbox');

        this._article_pages = [];

        this._debug_hotkey_action = new Gio.SimpleAction({
            name: 'debug-mode',
        });
        this.application.add_action(this._debug_hotkey_action);
        this.application.add_accelerator('<Control><Shift>B', 'app.debug-mode', null);
        this._debug_hotkey_action.connect('activate', function () {
            this.emit('debug-hotkey-pressed');
        }.bind(this));

        this._search_box = this.factory.create_named_module('top-bar-search');

        this._stack = new Gtk.Stack({
            transition_duration: this._STACK_TRANSITION_TIME,
        });
        this._arrangement = this.factory.create_named_module('document-arrangement', {
            transition_duration: this._STACK_TRANSITION_TIME,
        });
        this._stack.add(this.overview_page);
        this._stack.add(this.back_cover);
        this._stack.add(this.standalone_page);
        this._stack.add(this.search_results_page);
        this._stack.add(this._arrangement);
        this._stack.show_all();
        this.nav_buttons.add(this._stack);
        lightbox.add(this.nav_buttons);

        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
        });
        box.add(this._search_box);
        // Stick the debug nav buttons in a box with the search bar.
        // Looks a bit ugly but only used for debugging.
        box.add(this.issue_nav_buttons);

        this.page_manager.add(lightbox, {
            left_topbar_widget: this._history_buttons,
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
            let progress_label = this._article_pages[i].info_notice;
            progress_label.current_page = i + 2;
            progress_label.total_pages = this.total_pages;
        }
        this.back_cover.progress_label.current_page = this.total_pages;
        this.back_cover.progress_label.total_pages = this.total_pages;
    },

    /*
     *  Method: append_article_page
     *
     *  Appends an article page to the widget's array of article pages.
     */
    append_article_page: function (document_card) {
        document_card.show_all();
        if (!(document_card in this._article_pages)) {
            this._article_pages.push(document_card);
        }
        this._arrangement.add_card(document_card);
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
        this._arrangement.clear();
        this._article_pages = [];
        this._update_progress_labels();
    },

    _show_standalone_page: function () {
        this.standalone_page.show();
        this._stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        this._stack.set_visible_child(this.standalone_page);
        this.nav_buttons.back_visible = false;
        this.nav_buttons.forward_visible = false;
    },

    show_global_search_standalone_page: function () {
        this.standalone_page.infobar.show();
        this.standalone_page.document_card.info_notice.hide();
        this._show_standalone_page();
    },

    show_in_app_standalone_page: function () {
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
        this._set_stack_transition(animation_type, true);
        let page = this._article_pages[index];
        page.show();
        this._stack.set_visible_child(this._arrangement);
        this._arrangement.set_visible_child(page);
    },

    show_overview_page: function (animation_type) {
        this.nav_buttons.accommodate_scrollbar = false;
        this._set_stack_transition(animation_type);
        this.overview_page.show();
        this._stack.set_visible_child(this.overview_page);
    },

    show_back_cover: function (animation_type) {
        this.nav_buttons.accommodate_scrollbar = false;
        this._set_stack_transition(animation_type);
        this.back_cover.show();
        this._stack.set_visible_child(this.back_cover);
    },

    // Converts from our LoadingAnimationType enum to a GtkStackTransitionType
    _apply_animation_to_stack: function (animation_type, stack) {
        if (animation_type === EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION) {
            stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT);
        } else if (animation_type === EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION) {
            stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT);
        } else {
            stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        }
    },

    // Sets up the appropriate stack transtions for both the general stack
    // and the stack containing all the article pages (also known as the arrangement)
    _set_stack_transition: function (animation_type, moving_to_article_page=false) {
        let on_article_page = (this._stack.get_visible_child() === this._arrangement);
        // If we are moving just between article pages, then the desired animation type
        // needs to be set on the 'arrangement' stack - that is, the stack of document cards.
        // Otherwise, the arrangement needs to be set on the general view stack (and in this
        // case the arrangement stack should get no animation)
        let intra_arrangement_transition = (on_article_page && moving_to_article_page);
        if (intra_arrangement_transition) {
            this._apply_animation_to_stack(animation_type, this._arrangement);
            this._stack.set_transition_type(Gtk.StackTransitionType.NONE);
        } else {
            this._apply_animation_to_stack(animation_type, this._stack);
            this._arrangement.set_transition_type(Gtk.StackTransitionType.NONE);
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
        if (gdk_window)
            gdk_window.cursor = Gdk.Cursor.new(Gdk.CursorType.WATCH);
        this.page_manager.sensitive = false;
    },

    unlock_ui: function () {
        let gdk_window = this.page_manager.get_window();
        if (gdk_window)
            gdk_window.cursor = Gdk.Cursor.new(Gdk.CursorType.ARROW);
        this.page_manager.sensitive = true;
    },
});
