// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenuTemplate */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;
const StyleClasses = imports.app.styleClasses;

const _EXTRA_TOP_MARGIN = 50;

/**
 * Class: TopMenuTemplate
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
 *
 * Slots:
 *   top-menu - The content in the menu that slides out
 *   content - Main content of the template
 *
 */
const TopMenuTemplate = new Module.Class({
    Name: 'TopMenuTemplate',
    GTypeName: 'EknTopMenuTemplate',
    CssName: 'EknTopMenuTemplate',
    Extends: SlidingPanelOverlay.SlidingPanelOverlay,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'menu-open': GObject.ParamSpec.boolean('menu-open', 'Menu open',
            'Whether the menu is showing', GObject.ParamFlags.READABLE, false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/topMenuTemplate.ui',
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
        top_menu_container.get_style_context().add_class(StyleClasses.TOP_MENU);
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
                scrolled_widget.margin_top += _EXTRA_TOP_MARGIN;
        } else {
            content.margin_top += _EXTRA_TOP_MARGIN;
        }
    },

    get menu_open() {
        return this._menu_panel.reveal_panel;
    },

    // Module override
    get_slot_names: function () {
        return ['content', 'top-menu' ];
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
