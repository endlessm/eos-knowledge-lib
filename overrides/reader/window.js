// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const DonePage = imports.reader.donePage;
const NavButtonOverlay = imports.navButtonOverlay;
const OverviewPage = imports.reader.overviewPage;
const ProgressLabel = imports.reader.progressLabel;

/**
 * Class: Reader.Window
 * The window of the reader app.
 *
 * This class has the API to add, modify, and display article and done pages.
 * It adds to and removes from a private array of articlePages and
 * it updates the progressLabels on all of these pages according to which
 * page is being displayed.
 *
 */
const Window = new Lang.Class({
    Name: 'Window',
    GTypeName: 'EknReaderWindow',
    Extends: Endless.Window,
    Properties: {
        /**
         * Property: nav-buttons
         *
         * The <EosKnowledge.NavButtonOverlay> widget created by the window.
         * This property allows the presenter to connect to signals emitted
         * by the buttons. Read-only.
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
         * Property: current-page
         *
         * The current page number.
         *
         * Changing this property sets the current page to the specified index.
         * When the last article page is reached, the current page
         * is set to the done page.
         *
         */
        'current-page': GObject.ParamSpec.uint('current-page', 'Current page',
            'Page number currently being displayed',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0),
        
        /**
         * Property: total-pages
         *
         * The total number of pages.
         */
        'total-pages': GObject.ParamSpec.uint('total-pages', 'Total pages',
            'Number of pages in total',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXUINT32, 1),
    },

    Signals: {
        'debug-hotkey-pressed': {},
    },

    _STACK_TRANSITION_TIME: 500,
    _BACK_IMAGE_URI: 'resource:///com/endlessm/knowledge/reader/left-arrow.svg',
    _FORWARD_IMAGE_URI: 'resource:///com/endlessm/knowledge/reader/right-arrow.svg',
    _NAV_IMAGE_SIZE: 23,

    _init: function (props) {
        props = props || {};

        this._overview_page = new OverviewPage.OverviewPage();
        this._done_page = new DonePage.DonePage();
        this._nav_buttons = new NavButtonOverlay.NavButtonOverlay({
            back_image_uri: this._BACK_IMAGE_URI,
            forward_image_uri: this._FORWARD_IMAGE_URI,
            image_size: this._NAV_IMAGE_SIZE,
            accommodate_scrollbar: true,
        });

        this._issue_nav_buttons = new Endless.TopbarNavButton({
            no_show_all: true,
        });
        // No need for localization; this is debug only
        this._issue_nav_buttons.back_button.label = 'Prev issue';
        this._issue_nav_buttons.forward_button.label = 'Next issue';

        this._article_pages = [];
        this._current_page = 0;
        this.parent(props);

        this._debug_hotkey_action = new Gio.SimpleAction({
            name: 'debug-mode',
        });
        this.application.add_action(this._debug_hotkey_action);
        this.application.add_accelerator('<Control><Shift>B', 'app.debug-mode', null);
        this._debug_hotkey_action.connect('activate', function () {
            this.emit('debug-hotkey-pressed');
        }.bind(this));

        this._stack = new Gtk.Stack({
            transition_duration: this._STACK_TRANSITION_TIME,
        });
        this._stack.add(this._overview_page);
        this._stack.add(this._done_page);
        this._nav_buttons.add(this._stack);
        this.page_manager.add(this._nav_buttons, {
            center_topbar_widget: this._issue_nav_buttons,
        });
        this._overview_page.show_all();
        this._stack.set_visible_child(this._overview_page);
    },

    _update_progress_labels: function () {
        for (let i = 0; i < this._article_pages.length; i++) {
            // Account for overview and done pages
            this._article_pages[i].progress_label.current_page = i + 2;
            this._article_pages[i].progress_label.total_pages = this.total_pages;
        }
        this._done_page.progress_label.current_page = this.total_pages;
        this._done_page.progress_label.total_pages = this.total_pages;
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

    get overview_page() {
        return this._overview_page;
    },

    get done_page() {
        return this._done_page;
    },

    get nav_buttons() {
        return this._nav_buttons;
    },

    get issue_nav_buttons() {
        return this._issue_nav_buttons;
    },

    get current_page() {
        return this._current_page;
    },

    set current_page(value) {
        if (value === this._current_page)
            return;

        if (this._is_transitioning_forward(value)) {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT);
        } else {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT);
        }

        if (value === 0) {
            this._current_page = value;
            this._overview_page.show_all();
            this._stack.set_visible_child(this._overview_page);
        } else if (value <= this._article_pages.length && value > 0) {
            this._current_page = value;
            this._stack.set_visible_child(this._article_pages[value - 1]);
        } else if (value === this._article_pages.length + 1) {
            this._current_page = value;
            this._done_page.show_all();
            this._stack.set_visible_child(this._done_page);
        } else {
            throw new Error('Current page value is out of range.');
        }
        this.notify('current-page');
    },

    _is_transitioning_forward: function (value) {
        return value > this._current_page;
    },

    get total_pages() {
        // Done page and overview page account for extra incrementation.
        return this._article_pages.length + 2;
    },

});
