// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenu */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;

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
const TopMenu = new Module.Class({
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
        let upper = adjustment.upper;

        // FIXME: For now we just hide the top menu once the user has scrolled
        // down the page halfway. Eventually we want to do something more fancy
        // like hide the menu only if the user scrolls down 'quickly'.
        // https://github.com/endlessm/eos-sdk/issues/4092
        if (value >= upper / 2) {
            this._close_menu();
        } else {
            this._open_menu();
        }
    },

    _open_menu: function () {
        this._menu_panel.reveal_panel = true;
    },

    _close_menu: function () {
        this._menu_panel.reveal_panel = false;
    },
});
