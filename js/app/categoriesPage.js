// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const TabButton = imports.app.tabButton;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const BUTTON_TRANSITION_DURATION = 500;

/**
 * Class: CategoriesPage
 *
 * This represents the categories page for template A of the knowledge apps.
 * It displays a grid of cards representing all categories for this app.
 *
 */
const CategoriesPage = new Lang.Class({
    Name: 'CategoriesPage',
    GTypeName: 'EknCategoriesPage',
    Extends: Gtk.ScrolledWindow,

    Properties: {
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Set true if this page is animating and should hide its show all button',
            GObject.ParamFlags.READWRITE, false),
    },

    Signals: {
        /**
         * Event: show-home
         * This event is triggered when the home button is clicked.
         */
        'show-home': {}
    },

    _init: function (props) {
        props = props || {};
        props.hscrollbar_policy = Gtk.PolicyType.NEVER;

        this._grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });

        this._button_stack = new Gtk.Stack({
            transition_duration: BUTTON_TRANSITION_DURATION
        });

        this._invisible_frame = new Gtk.Frame();

        this._home_button = new TabButton.TabButton({
            position: Gtk.PositionType.TOP,
            label: _("HOME")
        });

        this._animating = false;
        this._button_stack.connect('notify::transition-running', Lang.bind(this, function (running) {
            let home_page_request = !this._button_stack.transition_running && this._button_stack.visible_child != this._home_button;
            if (home_page_request) {
                this.emit('show-home');
            }
        }));

        this._button_stack.add(this._invisible_frame);
        this._button_stack.add(this._home_button);
        this._home_button.connect('clicked', this._hide_button.bind(this));

        this._card_grid = new Gtk.FlowBox({
            valign: Gtk.Align.START,
            halign: Gtk.Align.START,
            homogeneous: true,
            expand: true,
            max_children_per_line: 10000,
            row_spacing: 20,
            margin: 40
        });

        this._grid.add(this._button_stack);
        this._grid.add(this._card_grid);

        this._cards = null;

        this.parent(props);
        this.add(this._grid);
        this.show_all();
    },

    get animating () {
        return this._animating;
    },

    set animating (v) {
        if (v === this._animating)
            return;
        this._animating = v;
        if (!this._animating && this.get_mapped()) {
            this._show_button();
        }
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            for (let card of this._cards) {
               this._card_grid.remove(card);
            }
        }
        this._cards = v;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_grid.add(card);
            }
        }
    },

    get cards () {
        return this._cards;
    },

    _hide_button: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        this._button_stack.visible_child = this._invisible_frame;
    },

    _show_button: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        this._button_stack.visible_child = this._home_button;
    }
});
