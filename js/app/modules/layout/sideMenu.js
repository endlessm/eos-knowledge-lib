// Copyright 2015 Endless Mobile, Inc.

/* exported SideMenu */

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;
const Utils = imports.app.utils;

const _MENU_HOT_ZONE_WIDTH_PX = 3;

/**
 * Class: SideMenu
 * A layout template that provides a context bar on top and a sliding side menu
 *
 * This layout template has one slot for its main content.
 * It shows a "context bar" above that content, which has another slot for a
 * module that shows context about the page, such as a <SetBanner>.
 *
 * The context bar has a button that opens a side menu, which is also a slot
 * that can be filled.
 * The side menu has a "Home" button on the top.
 * You can also open the menu by hovering the mouse near the side of the
 * template and close it by moving the mouse out of the menu.
 *
 * Implements:
 *   <Module>
 *
 * CSS classes:
 *   close-button - on the button that closes the menu
 *   context-bar - on the context bar
 *   context-bar-shadow-frame - hack for padding the context bar so the shadow
 *                              shows up
 *   home-button - on the button that goes to the home page
 *   menu - on the whole menu sidebar
 *   menu-button - on the button that opens the menu
 */
const SideMenu = new Module.Class({
    Name: 'Layout.SideMenu',
    Extends: SlidingPanelOverlay.SlidingPanelOverlay,

    Properties: {
        'menu-open': GObject.ParamSpec.boolean('menu-open', 'Menu open',
            'Whether the menu is showing', GObject.ParamFlags.READABLE, false),
    },

    Slots: {
        /**
         * Slot: content
         * Main content of the template
         */
        'content': {},
        /**
         * Slot: context
         * Slot for content in the center of the context bar (optional)
         */
        'context': {},
        /**
         * Slot: sidebar
         * The content in the menu that slides out (optional)
         */
        'sidebar': {},
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/sideMenu.ui',
    Children: [ 'home-button', 'menu-button', 'menu-close-button' ],
    InternalChildren: [ 'context-bar', 'grid', 'menu-grid', 'separator' ],

    _init: function (props={}) {
        this._menu_open = false;
        this.parent(props);

        let context = this.create_submodule('context', {
            hexpand: true,
            halign: Gtk.Align.CENTER,
        });
        if (context)
            this._context_bar.set_center_widget(context);

        this._menu_panel = this.add_panel_widget(this._menu_grid, Gtk.PositionType.LEFT);
        let klass = Utils.get_element_style_class(SideMenu, 'panel');
        this._menu_panel.get_style_context().add_class(klass);

        let sidebar = this.create_submodule('sidebar', {
            vexpand: true,
        });
        if (sidebar) {
            this._menu_grid.attach(sidebar, 0, 2, 2, 1);
        }

        let content = this.create_submodule('content');
        this._grid.add(content);

        this.menu_button.connect('clicked', this._open_menu.bind(this));
        this.menu_close_button.connect('clicked', this._close_menu.bind(this));
        this.connect('motion-notify-event', this._on_motion.bind(this));
        this.home_button.connect('clicked', this._on_home_clicked.bind(this));
    },

    get menu_open() {
        return this._menu_panel.reveal_panel;
    },

    _open_menu: function () {
        this._menu_panel.reveal_panel = true;
    },

    _close_menu: function () {
        this._menu_panel.reveal_panel = false;
    },

    _on_motion: function (widget, event) {
        let [got_coords, event_x] = event.get_root_coords();
        if (!got_coords)
            return Gdk.EVENT_PROPAGATE;

        let [ret, win_x, win_y] = this.get_window().get_origin();
        let x = event_x - win_x;
        if (!this.menu_open && x <= _MENU_HOT_ZONE_WIDTH_PX)
            this._open_menu();
        else if (this.menu_open && x > this._menu_grid.get_allocation().width)
            this._close_menu();
        return Gdk.EVENT_PROPAGATE;
    },

    vfunc_unmap: function () {
        this._close_menu();
        return this.parent();
    },

    _on_home_clicked: function () {
        this._close_menu();
        Dispatcher.get_default().dispatch({
            action_type: Actions.HOME_CLICKED,
        });
    },

    vfunc_draw: Utils.vfunc_draw_background_default,
});
