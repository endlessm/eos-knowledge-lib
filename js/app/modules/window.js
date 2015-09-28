// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GdkPixbuf = imports.gi.GdkPixbuf;
const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
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
         * The page created by this widget to represent the HomePage of the app. Read-only.
         */
        'home-page': GObject.ParamSpec.object('home-page', 'Home page',
            'The home page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
        /**
         * Property: section-page
         *
         * The section page template.
         */
        'section-page': GObject.ParamSpec.object('section-page', 'Section page',
            'The section page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
        /**
         * Property: article-page
         *
         * The article page template.
         */
        'article-page': GObject.ParamSpec.object('article-page', 'Article page',
            'The article page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
        /**
         * Property: search-page
         *
         * The search page template.
         */
        'search-page': GObject.ParamSpec.object('search-page', 'Search page',
            'The search page of this view widget.',
            GObject.ParamFlags.READABLE,
            Gtk.Widget),
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
         * Event: search-focused
         *
         * This event is triggered when the user focuses the search bar.
         */
        'search-focused': {
            param_types: [GObject.TYPE_BOOLEAN]
        },
    },

    TRANSITION_DURATION: 500,

    _init: function (props) {
        this.parent(props);

        this.home_page = this.factory.create_named_module('home-page-template');
        this.section_page = this.factory.create_named_module('section-page-template');
        this.search_page = this.factory.create_named_module('search-page-template');
        this.article_page = this.factory.create_named_module('article-page-template');
        if (this.template_type === 'B') {
            this.home_page.get_style_context().add_class(StyleClasses.HOME_PAGE_A);
            this.section_page.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
            this.search_page.get_style_context().add_class(StyleClasses.SEARCH_PAGE_B);
        } else {
            this.home_page.get_style_context().add_class(StyleClasses.HOME_PAGE_B);
            this.section_page.get_style_context().add_class(StyleClasses.SECTION_PAGE_A);
            this.search_page.get_style_context().add_class(StyleClasses.SEARCH_PAGE_A);
        }

        this._stack = new Gtk.Stack();
        this._stack.add(this.home_page);
        this._stack.add(this.section_page);
        this._stack.add(this.search_page);
        this._stack.add(this.article_page);

        let navigation = this.factory.create_named_module('navigation');
        navigation.add(this._stack);

        let lightbox = this.factory.create_named_module('lightbox');
        lightbox.add(navigation);

        this._history_buttons = new Endless.TopbarNavButton();
        this._search_box = this.factory.create_named_module('top-bar-search', {
            no_show_all: true,
            visible: false,
        });
        this.page_manager.add(lightbox, {
            left_topbar_widget: this._history_buttons,
            center_topbar_widget: this._search_box,
        });

        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_ENABLED_CHANGED,
            enabled: false,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_FORWARD_ENABLED_CHANGED,
            enabled: false,
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
                case Actions.SEARCH_STARTED:
                case Actions.SHOW_SET:
                    this.set_busy(true);
                    break;
                case Actions.SEARCH_READY:
                case Actions.SEARCH_FAILED:
                case Actions.SET_READY:
                    this.set_busy(false);
                    break;
            }
        });

        this._history_buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        this._history_buttons.show_all();

        this._stack.transition_duration = this.TRANSITION_DURATION;
        this._stack.connect('notify::transition-running', function () {
            this.home_page.animating = this._stack.transition_running;
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

        let is_on_left = (page) => page === this.home_page;
        let is_on_center = (page) => page === this.section_page || page === this.search_page;
        let nav_back_visible = false;
        if (is_on_left(new_page)) {
            this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            nav_back_visible = false;
            this._search_box.visible = false;
            this._set_background_position_style(StyleClasses.BACKGROUND_LEFT);
        } else if (is_on_center(new_page)) {
            if (is_on_left(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            } else if (is_on_center(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            }
            nav_back_visible = true;
            this._search_box.visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_CENTER);
        } else {
            this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            nav_back_visible = true;
            this._search_box.visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_RIGHT);
        }
        Dispatcher.get_default().dispatch({
            action_type: Actions.NAV_BACK_ENABLED_CHANGED,
            enabled: nav_back_visible,
        });
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
});
