const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

const HOME_PAGE_NAME = 'home';
const ARTICLE_PAGE_NAME = 'article';
const SEARCH_PAGE_NAME = 'search';

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
            Gtk.Widget),
        'article-page': GObject.ParamSpec.object('article-page', 'Article page',
            'The article page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
        'search-results-page': GObject.ParamSpec.object('search-results-page', 'Search results page',
            'The search results page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
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

    _init: function (props) {
        props = props || {};
        props.font_scaling_active = true;
        this.parent(props);

        let context = this.get_style_context();
        context.add_class(HOME_PAGE_NAME);

        this.home_page = this.factory.create_named_module('home-page-template');

        this.search_results_page = this.factory.create_named_module('search-page-template');

        this.article_page = this.factory.create_named_module('article-page-template');

        this._history_buttons = new Endless.TopbarNavButton();
        this._history_buttons.show_all();
        let dispatcher = Dispatcher.get_default();
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

        this.page_manager.transition_duration = 200;  // ms

        this.page_manager.add(this.home_page, {
            name: HOME_PAGE_NAME,
            background_uri: this.home_background_uri,
            background_repeats: false,
            background_size: 'cover',
            background_position: 'center center'
        });

        this.page_manager.add(this.search_results_page, {
            name: SEARCH_PAGE_NAME,
            left_topbar_widget: this._history_buttons,
            background_uri: this.results_background_uri,
            background_repeats: false,
            background_size: 'cover',
            background_position: 'top center',
        });

        this._lightbox = this.factory.create_named_module('lightbox');
        this._lightbox.add(this.article_page);

        this.page_manager.add(this._lightbox, {
            name: ARTICLE_PAGE_NAME,
            left_topbar_widget: this._history_buttons,
            background_uri: this.results_background_uri,
            background_repeats: false,
            background_size: 'cover',
            background_position: 'top center'
        });
        this.show_all();
    },

    get_visible_page: function () {
        return this.page_manager.visible_child;
    },

    show_search_results_page: function () {
        if (this.get_visible_page() === this.home_page) {
            this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        } else {
            this.page_manager.transition_type = Gtk.StackTransitionType.NONE;
        }
        this.page_manager.visible_child_name = SEARCH_PAGE_NAME;
    },

    show_article_page: function () {
        this.page_manager.transition_type = Gtk.StackTransitionType.NONE;
        this.page_manager.visible_child_name = ARTICLE_PAGE_NAME;
    },

    show_home_page: function () {
        this.page_manager.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        this.page_manager.visible_child_name = HOME_PAGE_NAME;
    },
});
