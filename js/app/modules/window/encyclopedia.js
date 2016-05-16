const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: Encyclopedia
 *
 * Slots:
 *   article-page
 *   home-page
 *   lightbox
 *   search-page
 */
const Encyclopedia = new Module.Class({
    Name: 'EncyclopediaWindow',
    Extends: Endless.Window,

    Properties: {
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

    Slots: {
        'article-page': {},
        'home-page': {},
        'lightbox': {},
        'search-page': {},
    },

    _init: function (props={}) {
        delete props.template_type;
        this.parent(props);

        this._home_page = this.create_submodule('home-page');
        this._home_page.get_style_context().add_class('home-page');
        this._search_page = this.create_submodule('search-page');
        this._search_page.get_style_context().add_class('search-page');
        this._article_page = this.create_submodule('article-page');
        this._article_page.get_style_context().add_class('article-page');

        this._home_button = new Endless.TopbarHomeButton({
            sensitive: false,
        });
        this._history_buttons = new Endless.TopbarNavButton();
        this._history_buttons.show_all();
        let dispatcher = Dispatcher.get_default();
        this._home_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HOME_CLICKED });
        });
        this._history_buttons.back_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
        });
        this._history_buttons.forward_button.connect('clicked', () => {
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
        });

        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.PRESENT_WINDOW:
                    this._pending_present = true;
                    this._present_timestamp = payload.timestamp;
                    break;
                case Actions.HISTORY_BACK_ENABLED_CHANGED:
                    this._history_buttons.back_button.sensitive = payload.enabled;
                    break;
                case Actions.HISTORY_FORWARD_ENABLED_CHANGED:
                    this._history_buttons.forward_button.sensitive = payload.enabled;
                    break;
                case Actions.SHOW_HOME_PAGE:
                    this.show_page(this._home_page);
                    break;
                case Actions.SHOW_SEARCH_PAGE:
                    this.show_page(this._search_page);
                    break;
                case Actions.SHOW_ARTICLE_PAGE:
                    this.show_page(this._article_page);
                    break;
            }
        });

        if (this.home_background_uri) {
            let page_css = '* { background-image: url("' + this.home_background_uri + '"); }';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(page_css);
            this.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        if (this.results_background_uri) {
            let page_css = '* { background-image: url("' + this.results_background_uri + '"); }';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(page_css);
            this._search_page.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
            this._article_page.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }

        let button_box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        button_box.add(this._home_button);
        button_box.add(this._history_buttons);
        button_box.show_all();

        this.page_manager.add(this._home_page, {
            left_topbar_widget: button_box,
        });

        this.page_manager.add(this._search_page, {
            left_topbar_widget: button_box,
        });

        this._lightbox = this.create_submodule('lightbox');
        this._lightbox.add(this._article_page);

        this.page_manager.add(this._lightbox, {
            left_topbar_widget: button_box,
        });
        this.get_child().show_all();

        this.page_manager.transition_duration = Utils.DEFAULT_PAGE_TRANSITION_DURATION;
        this.page_manager.connect('notify::transition-running', () => {
            if (this.page_manager.transition_running) {
                Utils.squash_all_window_content_updates_heavy_handedly(this);
            } else {
                Utils.unsquash_all_window_content_updates_heavy_handedly(this);
            }
        });
    },

    get_visible_page: function () {
        return this.page_manager.visible_child;
    },

    _present_if_needed: function () {
        if (this._pending_present) {
            if (this._present_timestamp)
                this.present_with_time(this._present_timestamp);
            else
                this.present();
            this._pending_present = false;
            this._present_timestamp = null;
        }
    },

    show_page: function (page) {
        // Disable the home button when the current page is the home page
        this._home_button.sensitive = (page !== this._home_page);

        if (this.get_visible_page() === page) {
            this._present_if_needed();
            return;
        }
        if (page === this._article_page)
            page = this._lightbox;
        if (this.get_visible_page() === this._home_page) {
            this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        } else if (page === this._home_page) {
            this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        } else {
            this.page_manager.transition_type = Gtk.StackTransitionType.NONE;
        }
        this.page_manager.visible_child = page;
        this._present_if_needed();
    },

    prepare_to_show: function () {
        this._home_page.prepare_to_show();
    },
});
