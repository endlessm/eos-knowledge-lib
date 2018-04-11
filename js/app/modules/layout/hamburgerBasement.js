// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;
const Module = imports.app.interfaces.module;
const SlidingPanel = imports.app.widgets.slidingPanel;
const TabButton = imports.app.widgets.tabButton;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: HamburgerBasement
 *
 * A template with two 'pages', a upper page with three vertical slots, and a
 * basement page with one large slot.
 *
 * CSS Styles:
 *      hamburger-basement-template - on the template
 */
var HamburgerBasement = new Module.Class({
    Name: 'Layout.HamburgerBasement',
    Extends: Gtk.Stack,

    Properties: {
        /**
         * Property: upper-button-label
         * Label on the tab button on the upper page
         */
        'upper-button-label': GObject.ParamSpec.string('upper-button-label',
            'Upper tab button label', 'Upper tab button label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            _("SEE ALL CATEGORIES")),
        /**
         * Property: show-upper-button
         * Whether to show the tab button on the upper page
         */
        'show-upper-button': GObject.ParamSpec.boolean('show-upper-button',
            'Show upper tab button', 'Show upper tab button',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: basement-button-label
         * Label on the tab button on the basement page
         */
        'basement-button-label': GObject.ParamSpec.string('basement-button-label',
            'Basement tab button label', 'Basement tab button label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            _("HOME")),
    },

    Slots: {
        'top': {},
        'middle': {},
        'bottom': {},
        'basement': {},
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/hamburgerBasement.ui',
    InternalChildren: ['upper-grid', 'inner-grid', 'basement-overlay'],

    _BUTTON_TRANSITION_TIME: 500,

    _init: function (props={}) {
        // FIXME: these should be in the template.ui file, but aren't working
        // from there. Why?
        props.transition_type = Gtk.StackTransitionType.SLIDE_UP_DOWN;
        props.transition_duration = 500;
        this.parent(props);

        ['top', 'middle'].forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this._inner_grid.add(submodule);
            this['_' + slot] = submodule;
        });

        this._bottom = this.create_submodule('bottom');
        this._upper_grid.attach(this._bottom, 0, 1, 1, 1);

        this._basement = this.create_submodule('basement');
        this._basement_overlay.add(this._basement);

        this._top_panel = this._setup_panel_button(Gtk.PositionType.TOP,
            Gtk.Align.START);
        this._bottom_panel = this._setup_panel_button(Gtk.PositionType.BOTTOM,
            Gtk.Align.END);

        this._basement_overlay.add_overlay(this._top_panel);
        this._upper_grid.attach(this._bottom_panel, 0, 2, 1, 1);

        this.set_visible_child(this._upper_grid);
        this.connect('notify::transition-running', this._update_panel_button.bind(this));

        this.connect('notify::show-upper-button', () => {
            this._bottom_panel.reveal_panel = this.show_upper_button;
        });
    },

    _update_panel_button: function() {
        if (this.transition_running)
            return;
        if (this.get_visible_child() === this._basement_overlay) {
            this._top_panel.reveal_panel = true;
        } else {
            this._bottom_panel.reveal_panel = this.show_upper_button;
        }
     },

    _setup_panel_button: function (position, valign) {
        let is_bottom = (position === Gtk.PositionType.BOTTOM);
        let button = new TabButton.TabButton({
            position: position,
            valign,
            visible: true,
            label: is_bottom ? this.upper_button_label : this.basement_button_label,
        });
        let panel = new SlidingPanel.SlidingPanel({
            valign,
            panel_widget: button,
            hide_direction: position,
            transition_duration: this._BUTTON_TRANSITION_TIME,
        });
        button.connect('clicked', () => {
            let next_page = is_bottom ? this._basement_overlay :
                this._upper_grid;
            let id = panel.connect('notify::panel-revealed', () => {
                this.set_visible_child(next_page);
                panel.disconnect(id);
                this._update_panel_button();
            });
            panel.reveal_panel = false;
        });
        return panel;
    },
});
