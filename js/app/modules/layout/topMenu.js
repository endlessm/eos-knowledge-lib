// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenu */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;

const Direction = {
    UP: 0,
    DOWN: 1,
};

const MIN_PIXELS_TO_ACTIVATE = {
    [Direction.UP]: 20,
    [Direction.DOWN]: 275,
};

/**
 * Class: TopMenu
 * A layout template with a top menu bar that slides out over the content
 *
 * This layout template has one slot for its main content and a slot for the
 * top menu bar.
 *
 * The top menu starts out visible and then slides upwards, out of sight as the
 * user scrolls down the page (assuming content is a scrolling template).
 * When the user scrolls back up, the top menu slides out and becomes visible
 * again.
 *
 * Implements:
 *   <Module>
 */
var TopMenu = new Module.Class({
    Name: 'Layout.TopMenu',
    Extends: SlidingPanelOverlay.SlidingPanelOverlay,

    Properties: {
        'menu-open': GObject.ParamSpec.boolean('menu-open', 'Menu open',
            'Whether the menu is showing', GObject.ParamFlags.READABLE, false),
    },

    Slots: {
        /**
         * Slot: top-menu
         * The content in the menu that slides out
         */
        'top-menu': {},
        /**
         * Slot: content
         * Main content of the template
         */
        'content': {},
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/topMenu.ui',
    InternalChildren: [ 'grid' ],

    _init: function (props={}) {
        this._menu_open = false;
        this.parent(props);

        let top_menu_container = new Gtk.Frame({
            halign: Gtk.Align.FILL,
            visible: true,
        });
        let top_menu = this.create_submodule('top-menu', {
            halign: Gtk.Align.FILL,
            visible: true,
        });
        top_menu_container.get_style_context().add_class('LayoutTopMenu__menu');
        top_menu_container.add(top_menu);

        this._menu_panel = this.add_panel_widget(top_menu_container, Gtk.PositionType.TOP);
        this._menu_panel.expand = true;

        this._previous_position = 0;
        this._previous_start = 0;
        this._previous_direction = Direction.DOWN;

        this._open_menu();
        let content = this.create_submodule('content');
        this._grid.add(content);

        if (content instanceof Gtk.ScrolledWindow) {
            content.vadjustment.connect('value-changed', this._on_scroll.bind(this));
            let scrolled_widget = content.get_child();
            if (scrolled_widget instanceof Gtk.Viewport)
                scrolled_widget = scrolled_widget.get_child();
            if (scrolled_widget)
                scrolled_widget.get_style_context().add_class('LayoutTopMenu__content');
        } else {
            content.get_style_context().add_class('LayoutTopMenu__content');
        }
    },

    get menu_open() {
        return this._menu_panel.reveal_panel;
    },

    _on_scroll: function (adjustment) {
        let value = adjustment.value;
        let direction = (value - this._previous_position) >= 0 ? Direction.DOWN : Direction.UP;

        // Track distance in current direction
        if (direction !== this._previous_direction)
            this._previous_start = value;

        let distance = value - this._previous_start;
        let min_distance =  MIN_PIXELS_TO_ACTIVATE[direction];
        this._previous_position = value;
        this._previous_direction = direction;

        // Check if moved enough distance
        if (!(Math.abs(distance) > min_distance))
            return;

        // Hide or show the panel if necessary
        if (direction === Direction.DOWN && this._is_open()) {
            this._close_menu();
        } else if (direction === Direction.UP && !this._is_open()) {
            this._open_menu();
        }
    },

    _is_open: function () {
        return this._menu_panel.reveal_panel;
    },

    _open_menu: function () {
        this._menu_panel.reveal_panel = true;
    },

    _close_menu: function () {
        this._menu_panel.reveal_panel = false;
    },
});
