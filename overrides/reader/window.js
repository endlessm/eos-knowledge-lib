// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const DonePage = imports.reader.donePage;
const Lightbox = imports.lightbox;
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
 * Adds a lightbox above the article page, which can be used to show content
 * above it.
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
        });

        this._issue_nav_buttons = new Endless.TopbarNavButton({
            no_show_all: true,
        });
        // No need for localization; this is debug only
        this._issue_nav_buttons.back_button.label = 'Reset';
        this._issue_nav_buttons.forward_button.label = 'Next week';

        this._lightbox = new Lightbox.Lightbox();
        this._lightbox.connect('navigation-previous-clicked', function (lightbox) {
            this.emit('lightbox-nav-previous-clicked', lightbox);
        }.bind(this));
        this._lightbox.connect('navigation-next-clicked', function (lightbox) {
            this.emit('lightbox-nav-next-clicked', lightbox);
        }.bind(this));

        this._article_pages = [];
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
        this._lightbox.add(this._nav_buttons);
        this.page_manager.add(this._lightbox, {
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

    show_article_page: function (index, transition_forward) {
        this._nav_buttons.accommodate_scrollbar = true;
        if (transition_forward) {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT);
        } else {
            this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT);
        }
        let page = this._article_pages[index];
        page.show();
        this._stack.set_visible_child(page);
    },

    show_overview_page: function () {
        this._nav_buttons.accommodate_scrollbar = false;
        this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT);
        this._overview_page.show();
        this._stack.set_visible_child(this._overview_page);
    },

    show_done_page: function () {
        this._stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT);
        this._done_page.show();
        this._stack.set_visible_child(this._done_page);
    },

    get lightbox() {
        return this._lightbox;
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

    get total_pages() {
        // Done page and overview page account for extra incrementation.
        return this._article_pages.length + 2;
    },
});
