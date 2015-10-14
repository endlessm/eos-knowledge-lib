// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const Module = imports.app.interfaces.module;
const TabButton = imports.app.widgets.tabButton;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: HomePageATemplate
 *
 * A Home Page Template used for Template A apps.
 *
 * CSS Styles:
 *      home-page-a-template - on the template
 */
const HomePageATemplate = new Lang.Class({
    Name: 'HomePageATemplate',
    GTypeName: 'EknHomePageATemplate',
    Extends: Gtk.Stack,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: upper-button-label
         * Label on the tab button on the upper page
         */
        'upper-button-label': GObject.ParamSpec.string('upper-button-label',
            'Upper tab button label', 'Upper tab button label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            _("SEE ALL CATEGORIES")),
        /**
         * Property: basement-button-label
         * Label on the tab button on the basement page
         */
        'basement-button-label': GObject.ParamSpec.string('basement-button-label',
            'Basement tab button label', 'Basement tab button label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            _("HOME")),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/homePageATemplate.ui',
    InternalChildren: [ 'upper-grid', 'inner-grid', 'upper-button-stack', 'basement-grid', 'basement-button-stack' ],


    _init: function (props={}) {
        this.parent(props);

        this._upper_tab_button = new TabButton.TabButton({
            position: Gtk.PositionType.BOTTOM,
            label: this.upper_button_label,
        });

        this._upper_button_stack.add(this._upper_tab_button);
        this._upper_button_stack.set_visible_child(this._upper_tab_button);

        ['top', 'middle'].forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this._inner_grid.add(submodule);
            this['_' + slot] = submodule;
        });

        this._bottom = this.create_submodule('bottom');
        this._upper_grid.attach(this._bottom, 0, 1, 1, 1);

        this._basement_tab_button = new TabButton.TabButton({
            position: Gtk.PositionType.TOP,
            label: this.basement_button_label,
        });
        this._basement_tab_button.show()

        this._basement_button_stack.add(this._basement_tab_button);
        this._basement_button_stack.set_visible_child(this._basement_tab_button);

        this._basement = this.create_submodule('basement');
        this._basement_grid.attach(this._basement, 0, 1, 1, 1);

        this._upper_grid.show_all();
        this.set_visible_child(this._upper_grid);

        [this._upper_tab_button, this._basement_tab_button].forEach((tab_button) => {
            tab_button.connect('clicked', (button) => {
                let in_basement = this.get_visible_child() === this._basement_grid;
                let transition = in_basement ? Gtk.StackTransitionType.SLIDE_UP : Gtk.StackTransitionType.SLIDE_DOWN;
                this._hide_button(button, transition);
                let stack = button.get_parent();
                let id = stack.connect('notify::transition-running', () => {
                    if (!stack.transition_running && stack.visible_child != button) {
                        let next_page = in_basement ? this._upper_grid : this._basement_grid;
                        this.transition_type = in_basement ? Gtk.StackTransitionType.SLIDE_DOWN : Gtk.StackTransitionType.SLIDE_UP;
                        this.set_visible_child(next_page);
                    }
                    stack.disconnect(id);
                });
            });
        });

        this.connect('notify::transition-running', () => {
            if (!this.transition_running) {
                if (this.get_visible_child() === this._basement_grid) {
                    this._show_button(this._basement_tab_button, Gtk.StackTransitionType.SLIDE_DOWN);
                } else {
                    this._show_button(this._upper_tab_button, Gtk.StackTransitionType.SLIDE_UP);
                }
            }
        });

        this._bottom.connect('notify::has-more-content', () => {
            if (this._bottom.has_more_content) {
                this._upper_tab_button.show();
                this._upper_button_stack.set_visible_child(this._upper_tab_button);
            }
        });
    },

    _hide_button: function (button, transition) {
        let stack = button.get_parent();
        let invisible_frame = stack.get_children()[0];
        stack.transition_type = transition;
        stack.visible_child = invisible_frame;
    },

    _show_button: function (button, transition) {
        let stack = button.get_parent();
        stack.transition_type = transition;
        stack.visible_child = button;
    },

    get_slot_names: function () {
        return ['top', 'middle', 'bottom', 'basement'];
    },
});
