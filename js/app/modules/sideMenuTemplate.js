// Copyright 2015 Endless Mobile, Inc.

/* exported SideMenuTemplate */

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;

const _MENU_HOT_ZONE_WIDTH_PX = 3;

/**
 * Class: SideMenuTemplate
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
 * Slots:
 *   sidebar - The content in the menu that slides out (optional)
 *   context - Slot for content in the center of the context bar (optional)
 *   content - Main content of the template
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
const SideMenuTemplate = new Lang.Class({
    Name: 'SideMenuTemplate',
    GTypeName: 'EknSideMenuTemplate',
    Extends: SlidingPanelOverlay.SlidingPanelOverlay,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'menu-open': GObject.ParamSpec.boolean('menu-open', 'Menu open',
            'Whether the menu is showing', GObject.ParamFlags.READABLE, false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/sideMenuTemplate.ui',
    Children: [ 'home-button', 'menu-button', 'menu-close-button' ],
    InternalChildren: [ 'context-bar-grid', 'grid', 'menu-grid', 'separator' ],

    _init: function (props={}) {
        this._menu_open = false;
        this.parent(props);

        let context = this.create_submodule('context', {
            hexpand: true,
            halign: Gtk.Align.CENTER,
        });
        if (context)
            this._context_bar_grid.add(context);

        this._menu_panel = this.add_panel_widget(this._menu_grid, Gtk.PositionType.LEFT);

        let sidebar = this.create_submodule('sidebar', {
            vexpand: true,
            // Try to adapt the margins to the margins we put on the rest of the
            // menu in the Glade file. (Setting a border-width on the menu grid
            // would be better, but a GtkContainer's border-width doesn't get
            // the background image in CSS.)
            margin_start: this._separator.margin_start,
            margin_end: this._separator.margin_end,
            margin_bottom: this.home_button.margin_top,
        });
        if (sidebar)
            this._menu_grid.attach(sidebar, 0, 2, 2, 1);

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

    // Module override
    get_slot_names: function () {
        return ['content', 'context', 'sidebar'];
    },

    _open_menu: function () {
        this._menu_panel.reveal_panel = true;
    },

    _close_menu: function () {
        this._menu_panel.reveal_panel = false;
    },

    _on_motion: function (widget, event) {
        let [got_coords, x] = event.get_coords();
        if (!got_coords)
            return Gdk.EVENT_PROPAGATE;

        if (!this.menu_open && x <= _MENU_HOT_ZONE_WIDTH_PX)
            this._open_menu();
        else if (this.menu_open && x > this._menu_grid.get_allocation().width)
            this._close_menu();
        return Gdk.EVENT_PROPAGATE;
    },

    _on_home_clicked: function () {
        this._close_menu();
        Dispatcher.get_default().dispatch({
            action_type: Actions.HOME_CLICKED,
        });
    },
});
