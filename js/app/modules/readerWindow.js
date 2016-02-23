// Copyright 2014 Endless Mobile, Inc.

/* exported ReaderWindow */

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

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
 *
 * Slots:
 *   archive-page
 *   back-page
 *   card-type
 *   document-arrangement
 *   front-page
 *   lightbox
 *   navigation
 *   search
 *   search-page
 *   standalone-page
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

    WINDOW_WIDTH_THRESHOLD: 800,
    WINDOW_HEIGHT_THRESHOLD: 600,

    _init: function (props) {
        props = props || {};
        this.parent(props);

        this._front_page = this.create_submodule('front-page');
        this._back_page = this.create_submodule('back-page');
        this._search_page = this.create_submodule('search-page');
        this._standalone_page = this.create_submodule('standalone-page');
        this._archive_page = this.create_submodule('archive-page');
        this._search_page.get_style_context().add_class(StyleClasses.READER_SEARCH_RESULTS_PAGE);

        let dispatcher = Dispatcher.get_default();
        let navigation = this.create_submodule('navigation');

        this.issue_nav_buttons = new Endless.TopbarNavButton({
            no_show_all: true,
        });

        this._home_button = new Endless.TopbarHomeButton();
        this._home_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HOME_CLICKED });
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
                case Actions.PRESENT_WINDOW:
                    this.show_all();
                    this.present_with_time(payload.timestamp);
                    break;
                case Actions.HISTORY_BACK_ENABLED_CHANGED:
                    this._history_buttons.back_button.sensitive = payload.enabled;
                    break;
                case Actions.HISTORY_FORWARD_ENABLED_CHANGED:
                    this._history_buttons.forward_button.sensitive = payload.enabled;
                    break;
                case Actions.SEARCH_STARTED:
                case Actions.SHOW_SET:
                    this.set_busy(true);
                    break;
                case Actions.SEARCH_READY:
                case Actions.SEARCH_FAILED:
                case Actions.SET_READY:
                    this.set_busy(false);
                    break;
                case Actions.SHOW_FRONT_PAGE:
                    this._show_front_page(payload.animation_type);
                    break;
                case Actions.SHOW_BACK_PAGE:
                    this._show_back_page(payload.animation_type);
                    break;
                case Actions.SHOW_ARTICLE_PAGE:
                    this._show_article_page(payload.index, payload.animation_type);
                    break;
                case Actions.SHOW_SEARCH_PAGE:
                    this._show_search_page();
                    break;
                case Actions.SHOW_ARCHIVE_PAGE:
                    this._show_archive_page();
                    break;
                case Actions.SHOW_STANDALONE_PAGE:
                    this._show_standalone_page();
                    break;
            }
        });

        // No need for localization; this is debug only
        this.issue_nav_buttons.back_button.label = 'Reset';
        this.issue_nav_buttons.forward_button.label = 'Next week';

        let lightbox = this.create_submodule('lightbox');

        this._article_pages = [];

        this._debug_hotkey_action = new Gio.SimpleAction({
            name: 'debug-mode',
        });
        this.application.add_action(this._debug_hotkey_action);
        this.application.add_accelerator('<Control><Shift>B', 'app.debug-mode', null);
        this._debug_hotkey_action.connect('activate', function () {
            this.emit('debug-hotkey-pressed');
        }.bind(this));

        this._search_box = this.create_submodule('search');

        this._stack = new Gtk.Stack({
            transition_duration: Utils.DEFAULT_PAGE_TRANSITION_DURATION,
        });
        this._arrangement = this.create_submodule('document-arrangement', {
            transition_duration: Utils.DEFAULT_PAGE_TRANSITION_DURATION,
        });
        this._stack.add(this._front_page);
        this._stack.add(this._back_page);
        this._stack.add(this._standalone_page);
        this._stack.add(this._archive_page);
        this._stack.add(this._search_page);
        this._stack.add(this._arrangement);
        this._stack.show_all();
        navigation.add(this._stack);
        lightbox.add(navigation);

        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
        });
        box.add(this._search_box);
        // Stick the debug nav buttons in a box with the search bar.
        // Looks a bit ugly but only used for debugging.
        box.add(this.issue_nav_buttons);

        let button_box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
        });
        button_box.add(this._home_button);
        button_box.add(this._history_buttons);

        this.page_manager.add(lightbox, {
            left_topbar_widget: button_box,
            center_topbar_widget: box,
        });
        this._front_page.show_all();
        this._stack.set_visible_child(this._front_page);

        this._stack.connect('notify::transition-running', () => {
            if (this._stack.transition_running) {
                this.get_style_context().add_class(StyleClasses.ANIMATING);
                Utils.squash_all_window_content_updates_heavy_handedly();
            } else {
                this.get_style_context().remove_class(StyleClasses.ANIMATING);
                Utils.unsquash_all_window_content_updates_heavy_handedly();
            }
        });
        this._stack.connect('notify::visible-child', () => this._update_nav_button_visibility());
        this._update_nav_button_visibility();
    },

    _update_nav_button_visibility: function () {
        // Disable the home button when the current page is the front page
        this._home_button.sensitive = (this._stack.visible_child !== this._front_page);

        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_ENABLED_CHANGED,
            enabled: this.article_pages_visible() && this._stack.visible_child !== this._front_page,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_FORWARD_ENABLED_CHANGED,
            enabled: this.article_pages_visible(),
        });
    },

    _update_progress_labels: function () {
        this._article_pages.forEach((page, ix) => {
            // Account for overview and done pages
            page.page_number = ix + 2;
            page.total_pages = this.total_pages;
        });
        this._back_page.progress_label.current_page = this.total_pages;
        this._back_page.progress_label.total_pages = this.total_pages;
    },

    /**
     * Method: append_article_page
     * Creates an article page and appends it to the window
     *
     * Parameters:
     *   model - the <ContentObjectModel> from which to create a page
     */
    append_article_page: function (model) {
        // FIXME: This should probably be a slot on a document page and not the
        // window.
        this._arrangement.add_model(model);
        // FIXME: ReaderWindow should not deal with DocumentCard widgets.
        let document_card = this._arrangement.get_card_for_model(model);
        document_card.connect('ekn-link-clicked', (card, uri) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: uri,
            });
        });
        document_card.show_all();
        if (!(document_card in this._article_pages)) {
            this._article_pages.push(document_card);
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
        this._arrangement.clear();
        this._article_pages = [];
        this._update_progress_labels();
    },

    _show_standalone_page: function () {
        this._standalone_page.show();
        this._stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        this._stack.set_visible_child(this._standalone_page);
    },

    _show_archive_page: function () {
        this._archive_page.show();
        this._stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        this._stack.set_visible_child(this._archive_page);
    },

    _show_search_page: function () {
        this._stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE);
        this._stack.set_visible_child(this._search_page);
    },

    _show_article_page: function (index, animation_type) {
        this._set_stack_transition(animation_type, true);
        let page = this._article_pages[index];
        page.show();
        this._stack.set_visible_child(this._arrangement);
        this._arrangement.set_visible_child(page);
    },

    _show_front_page: function (animation_type) {
        this._set_stack_transition(animation_type);
        this._front_page.show();
        this._stack.set_visible_child(this._front_page);
    },

    _show_back_page: function (animation_type) {
        this._set_stack_transition(animation_type);
        this._back_page.show();
        this._stack.set_visible_child(this._back_page);
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
        let not_article_pages = [this._search_page, this._standalone_page,
            this._archive_page];
        return not_article_pages.indexOf(this._stack.get_visible_child()) === -1;
    },

    get total_pages() {
        // Front and back page account for extra incrementation.
        return this._article_pages.length + 2;
    },

    set_busy: function (busy) {
        let gdk_window = this.page_manager.get_window();
        if (!gdk_window)
            return;

        let cursor = null;
        if (busy)
            cursor = Gdk.Cursor.new_for_display(Gdk.Display.get_default(),
                Gdk.CursorType.WATCH);
        gdk_window.cursor = cursor;
    },

    get_slot_names: function () {
        return ['archive-page', 'back-page', 'card-type', 'document-arrangement',
            'front-page', 'lightbox', 'navigation', 'search', 'search-page',
            'standalone-page'];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let context = this.get_style_context();
        if (alloc.width <= this.WINDOW_WIDTH_THRESHOLD || alloc.height <= this.WINDOW_HEIGHT_THRESHOLD) {
            context.remove_class(StyleClasses.WINDOW_LARGE);
            context.add_class(StyleClasses.WINDOW_SMALL);
        } else {
            context.remove_class(StyleClasses.WINDOW_SMALL);
            context.add_class(StyleClasses.WINDOW_LARGE);
        }
    }
});
