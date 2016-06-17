// Copyright 2016 Endless Mobile, Inc.

/* exported Simple */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: Pager.Simple
 * Handle transitions between pages in an app
 *
 * CSS classes:
 *   PagerSimple--animating - while a page transition is running
 */
const Simple = new Module.Class({
    Name: 'Pager.Simple',
    Extends: Gtk.Stack,

    StyleProperties: {
        /* FIXME: this is a hack to be able to set different transition styles
        in CSS rather than programmatically by template type. More ideal would
        be to set all page transitions in CSS, then read the transition
        directions and styles from the pager's style context. */
        'transitions-style': GObject.ParamSpec.string('transitions-style',
            'Transitions style',
            'Style for page transition animations (none, slide-all, slide-center, splash)',
            GObject.ParamFlags.READWRITE, 'slide-all'),
    },

    Slots: {
        'all-sets-page': {},  // optional
        'article-page': {},  // optional
        'brand-page': {},  // optional
        'home-page': {},
        'search-page': {},  // optional
        'set-page': {},  // optional
    },

    _init: function (props={}) {
        props.transition_duration = 0;
        this.parent(props);

        this._transitions_style = 'slide-all';

        this._brand_page = this.create_submodule('brand-page');
        if (this._brand_page) {
            this._brand_page.get_style_context().add_class('brand-page');
            this.add(this._brand_page);
        }

        this._home_page = this.create_submodule('home-page');
        this._home_page.get_style_context().add_class('home-page');
        this.add(this._home_page);

        this._set_page = this.create_submodule('set-page');
        if (this._set_page) {
            this._set_page.get_style_context().add_class('set-page');
            this.add(this._set_page);
        }

        this._search_page = this.create_submodule('search-page');
        if (this._search_page) {
            this._search_page.get_style_context().add_class('search-page');
            this.add(this._search_page);
        }

        this._article_page = this.create_submodule('article-page');
        if (this._article_page) {
            this._article_page.get_style_context().add_class('article-page');
            this.add(this._article_page);
        }

        this._all_sets_page = this.create_submodule('all-sets-page');
        if (this._all_sets_page) {
            this._all_sets_page.get_style_context().add_class('all-sets-page');
            this.add(this._all_sets_page);
        }

        let _animating_class = Utils.get_modifier_style_class(Simple,
            'animating');
        this.connect('notify::transition-running', () => {
            if (this.transition_running)
                this.get_style_context().add_class(_animating_class);
            else
                this.get_style_context().remove_class(_animating_class);
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

        dispatcher.register(payload => {
            switch (payload.action_type) {
                case Actions.SHOW_BRAND_PAGE:
                    if (this._brand_page)
                        this._show_page(this._brand_page);
                    else
                        this._show_page(this._home_page);
                    break;
                case Actions.SHOW_HOME_PAGE:
                    this._show_page(this._home_page);
                    break;
                case Actions.SHOW_SET_PAGE:
                    if (this._set_page)
                        this._show_page(this._set_page);
                    break;
                case Actions.SHOW_ALL_SETS_PAGE:
                    if (this._all_sets_page)
                        this._show_page(this._all_sets_page);
                    break;
                case Actions.SHOW_SEARCH_PAGE:
                    if (this._search_page)
                        this._show_page(this._search_page);
                    break;
                case Actions.SHOW_ARTICLE_PAGE:
                    if (this._article_page)
                        this._show_page(this._article_page);
                    break;
            }
        });
    },

    // Module override
    make_ready: function (cb=function () {}) {
        this._home_page.make_ready(cb);
    },

    _show_page: function (new_page) {
        let old_page = this.visible_child;
        if (old_page === new_page) {
            // Even though we didn't change, this should still count as the
            // first transition.
            this.transition_duration = Utils.DEFAULT_PAGE_TRANSITION_DURATION;
            return;
        }

        new_page.make_ready();

        let context = this.get_style_context();
        let flags = this.get_state_flags();
        let transitions_style =
            EosKnowledgePrivate.style_context_get_custom_string(context,
                'transitions-style', flags);
        this.transition_type = this._get_transition(new_page, old_page,
            transitions_style);

        Dispatcher.get_default().dispatch({
            action_type: Actions.NAV_BACK_ENABLED_CHANGED,
            enabled: !this._is_page_on_left(new_page),
        });
        this.visible_child = new_page;

        // The first transition on app startup has duration 0, subsequent ones
        // are normal.
        this.transition_duration = Utils.DEFAULT_PAGE_TRANSITION_DURATION;
    },

    _is_page_on_center: function (page) {
        return [this._set_page, this._search_page].indexOf(page) > -1;
    },

    _is_page_on_left: function (page) {
        return [this._home_page, this._brand_page].indexOf(page) > -1;
    },

    _get_transition: function (new_page, old_page, transitions_style) {
        switch (transitions_style) {
            case 'slide-all':
                return this._get_transition_slide_all(new_page, old_page);
            case 'slide-center':
                return this._get_transition_slide_center(new_page, old_page);
            case 'splash':
                return this._get_transition_splash(new_page, old_page);
            case 'none':
                break;
            default:
                logError(new Error('Unrecognized value for -EknPager_Simple-transitions-style'));
        }
        return Gtk.StackTransitionType.NONE;
    },

    _get_transition_slide_all: function (new_page, old_page) {
        if (this._is_page_on_left(new_page)) {
            if (this._is_page_on_left(old_page))
                return Gtk.StackTransitionType.CROSSFADE;
            return Gtk.StackTransitionType.SLIDE_RIGHT;
        } else if (this._is_page_on_center(new_page)) {
            if (this._is_page_on_left(old_page))
                return Gtk.StackTransitionType.SLIDE_LEFT;
            if (this._is_page_on_center(old_page))
                return Gtk.StackTransitionType.CROSSFADE;
            return Gtk.StackTransitionType.SLIDE_RIGHT;
        }
        return Gtk.StackTransitionType.SLIDE_LEFT;
    },

    _get_transition_slide_center: function (new_page, old_page) {
        if (this._is_page_on_left(new_page)) {
            if (this._is_page_on_left(old_page))
                return Gtk.StackTransitionType.CROSSFADE;
            return Gtk.StackTransitionType.SLIDE_RIGHT;
        } else if (this._is_page_on_center(new_page)) {
            if (this._is_page_on_left(old_page))
                return Gtk.StackTransitionType.SLIDE_LEFT;
            return Gtk.StackTransitionType.CROSSFADE;
        }
        return Gtk.StackTransitionType.CROSSFADE;
    },

    _get_transition_splash: function (new_page, old_page) {
        if (old_page === this._home_page)
            return Gtk.StackTransitionType.SLIDE_UP;
        if (new_page === this._home_page)
            return Gtk.StackTransitionType.SLIDE_DOWN;
        return Gtk.StackTransitionType.NONE;
    },
});
