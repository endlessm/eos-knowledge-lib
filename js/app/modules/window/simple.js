// Copyright 2014 Endless Mobile, Inc.

/* exported Simple */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const SearchBox = imports.app.modules.navigation.searchBox;
const Utils = imports.app.utils;

/**
 * Class: Window.Simple
 * Window with default functionality
 *
 * Slots:
 *   lightbox - optional
 *   navigation - optional
 *   pager
 *   search - optional
 */
const Simple = new Module.Class({
    Name: 'Window.Simple',
    Extends: Endless.Window,

    Properties: {
        /**
         * Property: animating
         *
         * Temporary property which can be used to notify when the page
         * transition our running. Will likely be replaced when we have a better
         * way to update state between non-controller modules.
         */
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Animating',
            GObject.ParamFlags.READABLE, false),
    },

    Slots: {
        'lightbox': {},
        'navigation': {},  // optional
        'pager': {},
        'search': {},
    },

    WINDOW_WIDTH_THRESHOLD: 800,
    WINDOW_HEIGHT_THRESHOLD: 600,

    _init: function (props) {
        this.parent(props);

        // Set window title from desktop application file
        let app_id = Gio.Application.get_default().application_id;
        let app_info = Gio.DesktopAppInfo.new(app_id + '.desktop');
        this.title = (app_info) ? app_info.get_display_name() : app_id;

        // We need to pack a bunch of modules inside each other, but some of
        // them are optional. "matryoshka" is the innermost widget that needs to
        // have something packed around it.
        this._pager = this.create_submodule('pager');
        let matryoshka = this._pager;

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

        this._home_button = new Endless.TopbarHomeButton();
        this._history_buttons = new Endless.TopbarNavButton();

        // Keep the search bar in a stack for two reasons
        //  - our top bar will always be constant sized
        //  - showing the search bar will not trigger a window resize
        this._search_stack = new Gtk.Stack();
        this._invisible_frame = new Gtk.Frame();
        this._search_stack.add(this._invisible_frame);
        this._search_box = this.create_submodule('search');
        if (this._search_box)
            this._search_stack.add(this._search_box);
        this._search_stack.show_all();

        let button_box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        button_box.add(this._home_button);
        button_box.add(this._history_buttons);

        this.page_manager.add(matryoshka, {
            left_topbar_widget: button_box,
            center_topbar_widget: this._search_stack,
        });

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

        HistoryStore.get_default().connect('changed', this._on_history_change.bind(this));
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
                case Actions.PAGE_READY:
                    this.set_busy(false);
                    break;
                case Actions.LAUNCHED_FROM_DESKTOP:
                case Actions.DBUS_LOAD_QUERY_CALLED:
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    this._pending_present = true;
                    this._present_timestamp = payload.timestamp;
                    break;
                case Actions.SHOW_BRAND_PAGE:
                case Actions.SHOW_HOME_PAGE:
                    this._home_button.sensitive = false;
                    // Even if we didn't change, this should still count as the
                    // first transition.
                    this._update_top_bar_visibility();
                    this._present_if_needed();
                    break;
                case Actions.SHOW_SET_PAGE:
                case Actions.SHOW_ALL_SETS_PAGE:
                case Actions.SHOW_SEARCH_PAGE:
                case Actions.SHOW_ARTICLE_PAGE:
                    this._home_button.sensitive = true;
                    this._update_top_bar_visibility();
                    this._present_if_needed();
                    break;
            }
        });

        this._history_buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        button_box.show_all();

        this.animating = false;
        let focused_widget = null;
        this._pager.connect('notify::transition-running', function () {
            this.animating = this._pager.transition_running;
            this.notify('animating');
            if (this._pager.transition_running) {
                focused_widget = this.get_focus();
                Utils.squash_all_window_content_updates_heavy_handedly(this);
            } else {
                Utils.unsquash_all_window_content_updates_heavy_handedly(this);
                if (focused_widget && !this.get_focus()) {
                    focused_widget.grab_focus();
                    focused_widget = null;
                }
            }
        }.bind(this));

        this._pager.connect_after('notify::visible-child',
            this._update_top_bar_visibility.bind(this));

        this.get_child().show_all();
    },

    _on_history_change: function (history) {
        this._history_buttons.back_button.sensitive = history.can_go_back();
        this._history_buttons.forward_button.sensitive = history.can_go_forward();
    },

    _update_top_bar_visibility: function () {
        let new_page = this._pager.visible_child;
        if (Utils.has_descendant_with_type(new_page, SearchBox.SearchBox)) {
            this._search_stack.visible_child = this._invisible_frame;
        } else {
            this._search_stack.visible_child = this._search_box;
        }
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

    make_ready: function (cb=function () {}) {
        this._pager.make_ready(cb);
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

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let context = this.get_style_context();
        if (alloc.width <= this.WINDOW_WIDTH_THRESHOLD || alloc.height <= this.WINDOW_HEIGHT_THRESHOLD) {
            context.remove_class('window-large');
            context.add_class('window-small');
        } else {
            context.remove_class('window-small');
            context.add_class('window-large');
        }
    }
});
