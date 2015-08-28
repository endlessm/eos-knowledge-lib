// Copyright 2014 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const TabButton = imports.app.widgets.tabButton;

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
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Set true if this page is animating and should hide its show all button',
            GObject.ParamFlags.READWRITE, false),
        /**
         * Property: tab-button
         *
         * The <TabButton> widget created by this widget. Read-only,
         * modify using the <TabButton> API.
         */
        'tab-button': GObject.ParamSpec.object('tab-button', 'Tab button',
            'The button to show home page.',
            GObject.ParamFlags.READABLE,
            TabButton.TabButton),
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

        this.tab_button = new TabButton.TabButton({
            position: Gtk.PositionType.TOP,
            label: _("HOME"),
        });

        this._animating = false;
        this._button_stack.connect('notify::transition-running', Lang.bind(this, function (running) {
            let home_page_request = !this._button_stack.transition_running && this._button_stack.visible_child != this.tab_button;
            if (home_page_request) {
                this.emit('show-home');
            }
        }));

        this._button_stack.add(this._invisible_frame);
        this._button_stack.add(this.tab_button);
        this.tab_button.connect('clicked', this._hide_button.bind(this));

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

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SETS:
                    for (let card of this._card_grid.get_children()) {
                        this._card_grid.remove(card);
                    }
                    break;
                case Actions.APPEND_SETS:
                    for (let model of payload.models) {
                        let card = this.factory.create_named_module('home-card', {
                            model: model,
                        });
                        card.connect('clicked', () => {
                            dispatcher.dispatch({
                                action_type: Actions.SET_SELECTED,
                                model: model,
                            });
                        });
                        this._card_grid.add(card);
                    }
                    break;
            }
        });


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

    _hide_button: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        this._button_stack.visible_child = this._invisible_frame;
    },

    _show_button: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        this._button_stack.visible_child = this.tab_button;
    }
});
