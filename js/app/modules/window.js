// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Launcher = imports.app.interfaces.launcher;
const Module = imports.app.interfaces.module;
const SearchBox = imports.app.modules.searchBox;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: blur-background-image-uri
         *
         * The blurred background image uri for this window.
         * Gets set on section and article pages of the application.
         */
        'blur-background-image-uri': GObject.ParamSpec.string('blur-background-image-uri', 'Blurred background image URI',
            'The blurred background image of this window.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
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

    WINDOW_WIDTH_THRESHOLD: 800,
    WINDOW_HEIGHT_THRESHOLD: 600,
    TRANSITION_DURATION: 500,

    _init: function (props) {
        this.parent(props);

        let context = this.get_style_context();
        this._bg_size_provider = new Gtk.CssProvider();
        context.add_provider(this._bg_size_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        this._home_page = this.create_submodule('home-page');
        this._section_page = this.create_submodule('section-page');
        this._all_sets_page = this.create_submodule('all-sets-page');
        this._search_page = this.create_submodule('search-page');
        this._article_page = this.create_submodule('article-page');
        this._brand_screen = this.create_submodule('brand-screen');
        if (this.template_type === 'B') {
            this._home_page.get_style_context().add_class(StyleClasses.HOME_PAGE_B);
            this._section_page.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
            this._search_page.get_style_context().add_class(StyleClasses.SEARCH_PAGE_B);
            this._article_page.get_style_context().add_class(StyleClasses.ARTICLE_PAGE_B);
        } else {
            this._home_page.get_style_context().add_class(StyleClasses.HOME_PAGE_A);
            this._section_page.get_style_context().add_class(StyleClasses.SECTION_PAGE_A);
            this._search_page.get_style_context().add_class(StyleClasses.SEARCH_PAGE_A);
            this._article_page.get_style_context().add_class(StyleClasses.ARTICLE_PAGE_A);
        }

        this._stack = new Gtk.Stack({
            transition_duration: 0,
        });
        if (this._brand_screen)
            this._stack.add(this._brand_screen);
        this._stack.add(this._home_page);
        this._stack.add(this._section_page);
        this._stack.add(this._search_page);
        this._stack.add(this._article_page);
        if (this._all_sets_page)
            this._stack.add(this._all_sets_page);

        // We need to pack a bunch of modules inside each other, but some of
        // them are optional. "matryoshka" is the innermost widget that needs to
        // have something packed around it.
        let matryoshka = this._stack;

        let navigation = this.create_submodule('navigation');
        if (navigation) {
            navigation.add(matryoshka);
            matryoshka = navigation;
        }

        let lightbox = this.create_submodule('lightbox');
        if (lightbox) {
            lightbox.add(matryoshka);
            matryoshka = lightbox;
        }

        this._history_buttons = new Endless.TopbarNavButton();

        // FIXME: comment
        this._search_stack = new Gtk.Stack();
        this._invisible_frame = new Gtk.Frame();
        this._search_stack.add(this._invisible_frame);
        this._search_box = this.create_submodule('search');
        this._search_stack.add(this._search_box);
        this._search_stack.show_all();

        this.page_manager.add(matryoshka, {
            left_topbar_widget: this._history_buttons,
            center_topbar_widget: this._search_stack,
        });

        let frame_css = '';
        if (this.background_image_uri) {
            frame_css += '\
                EknWindow.background-left { \
                    background-image: url("' + this.background_image_uri + '");\
                }\n';
            try {
                let stream = Gio.File.new_for_uri(this.background_image_uri).read(null);
                let bg_pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
                this._background_image_width = bg_pixbuf.width;
                this._background_image_height = bg_pixbuf.height;
            } catch (e) {
                logError(e, 'Background image URI is not a valid format.');
            }
        }
        if (this.blur_background_image_uri) {
            frame_css += '\
                EknWindow.background-center, EknWindow.background-right { \
                    background-image: url("' + this.blur_background_image_uri + '");\
                }';
        }

        if (frame_css !== '') {
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
        if (!Utils.low_performance_mode())
            this.get_style_context().add_class('parallax');

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
                case Actions.FIRST_LAUNCH:
                    if (payload.timestamp)
                        this.present_with_time(payload.timestamp);
                    else
                        this.present();
                    break;
                case Actions.SHOW_BRAND_SCREEN:
                    if (this._brand_screen)
                        this.show_page(this._brand_screen);
                    break;
                case Actions.BRAND_SCREEN_DONE:
                    if (this._brand_screen)
                        this.show_page(this._home_page);
                    break;
                case Actions.SHOW_HOME_PAGE:
                    this.show_page(this._home_page);
                    break;
                case Actions.SHOW_SECTION_PAGE:
                    this.show_page(this._section_page);
                    break;
                case Actions.SHOW_ALL_SETS_PAGE:
                    this.show_page(this._all_sets_page);
                    break;
                case Actions.SHOW_SEARCH_PAGE:
                    this.show_page(this._search_page);
                    break;
                case Actions.SHOW_ARTICLE_PAGE:
                    this.show_page(this._article_page);
                    break;
            }
        });

        this._history_buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        this._history_buttons.show_all();

        this._stack.connect('notify::transition-running', function () {
            this._home_page.animating = this._stack.transition_running;
            if (this._stack.transition_running)
                context.add_class(StyleClasses.ANIMATING);
            else
                context.remove_class(StyleClasses.ANIMATING);
        }.bind(this));

        this._stack.connect_after('notify::visible-child',
            this._update_top_bar_visibility.bind(this));

        this.get_child().show_all();
        this._set_background_position_style(StyleClasses.BACKGROUND_LEFT);
    },

    _set_background_position_style: function (klass) {
        let context = this.get_style_context();
        context.remove_class(StyleClasses.BACKGROUND_LEFT);
        context.remove_class(StyleClasses.BACKGROUND_CENTER);
        context.remove_class(StyleClasses.BACKGROUND_RIGHT);
        context.add_class(klass);
    },

    _update_top_bar_visibility: function () {
        let new_page = this._stack.visible_child;
        if (Utils.has_descendant_with_type(new_page, SearchBox.SearchBox)) {
            this._search_stack.visible_child = this._invisible_frame;
        } else {
            this._search_stack.visible_child = this._search_box;
        }
    },

    show_page: function (new_page) {
        let old_page = this.get_visible_page();
        if (old_page === new_page) {
            // Even though we didn't change, this should still count as the
            // first transition.
            this._stack.transition_duration = this.TRANSITION_DURATION;
            this._update_top_bar_visibility();
            return;
        }

        let is_on_left = (page) => [this._home_page, this._brand_screen].indexOf(page) > -1;
        let is_on_center = (page) => [this._section_page, this._search_page].indexOf(page) > -1;
        let nav_back_visible = false;
        if (is_on_left(new_page)) {
            nav_back_visible = false;
            this._set_background_position_style(StyleClasses.BACKGROUND_LEFT);
            if (is_on_left(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            }
        } else if (is_on_center(new_page)) {
            if (is_on_left(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            } else if (is_on_center(old_page)) {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else if (this.template_type === 'B') {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
            }
            nav_back_visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_CENTER);
        } else {
            if (this.template_type === 'B') {
                this._stack.transition_type = Gtk.StackTransitionType.CROSSFADE;
            } else {
                this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
            }
            nav_back_visible = true;
            this._set_background_position_style(StyleClasses.BACKGROUND_RIGHT);
        }
        Dispatcher.get_default().dispatch({
            action_type: Actions.NAV_BACK_ENABLED_CHANGED,
            enabled: nav_back_visible,
        });
        this._stack.visible_child = new_page;

        // The first transition on app startup has duration 0, subsequent ones
        // are normal.
        this._stack.transition_duration = this.TRANSITION_DURATION;
    },

    /**
     * Method: get_visible_page
     * Returns the currently visible page
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

    // Module override
    get_slot_names: function () {
        return ['brand-screen', 'home-page', 'section-page', 'all-sets-page', 'search-page',
            'article-page', 'navigation', 'lightbox', 'search'];
    },

    vfunc_get_preferred_width: function () {
        printerr('RESIZE');
        return this.parent();
    },

    vfunc_size_allocate: function (alloc) {
        printerr('ALLOCATE');
        this.parent(alloc);

        let context = this.get_style_context();
        if (alloc.width <= this.WINDOW_WIDTH_THRESHOLD || alloc.height <= this.WINDOW_HEIGHT_THRESHOLD) {
            context.remove_class(StyleClasses.WINDOW_LARGE);
            context.add_class(StyleClasses.WINDOW_SMALL);
        } else {
            context.remove_class(StyleClasses.WINDOW_SMALL);
            context.add_class(StyleClasses.WINDOW_LARGE);
        }

        if (Utils.low_performance_mode())
            return;

        // FIXME: if GTK gains support for the 'vmax' CSS unit, then we can move
        // this calculation to pure CSS and get rid of the extra CSS provider.
        // https://developer.mozilla.org/en-US/docs/Web/CSS/length
        if (this.background_image_uri &&
            (!this._last_allocation ||
            this._last_allocation.width !== alloc.width ||
            this._last_allocation.height !== alloc.height)) {
            let bg_mult_ratio = Math.max(alloc.width / this._background_image_width,
                alloc.height / this._background_image_height) *
                PARALLAX_BACKGROUND_SCALE;
            let bg_width = Math.ceil(this._background_image_width * bg_mult_ratio);
            let bg_height = Math.ceil(this._background_image_height * bg_mult_ratio);
            let frame_css = 'EknWindow { background-size: ' + bg_width + 'px ' +
                bg_height + 'px; }';
            this._bg_size_provider.load_from_data(frame_css);
        }
        this._last_allocation = alloc;
    }
});
