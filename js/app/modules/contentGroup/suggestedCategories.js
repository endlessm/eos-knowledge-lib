// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedCategories */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const ThemeableImage = imports.app.widgets.themeableImage;

const Utils = imports.app.utils;

/**
 * Class: SuggestedCategories
 * A module that displays all suggested articles as cards in an arrangement.
 *
 * CSS classes:
 *   suggested-categories - on the module itself
 *   browse-content - on the "Browse Categories" title
 *
 * Slots:
 *   arrangement
 */
const SuggestedCategories = new Module.Class({
    Name: 'ContentGroup.SuggestedCategories',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: show-title
         * Whether to show the title at the top
         *
         * Default value:
         *   true
         */
        'show-title': GObject.ParamSpec.boolean('show-title',
            'Show title', 'Whether to show the title at the top',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    Slots: {
        'arrangement': {},
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/contentGroup/suggestedCategories.ui',
    InternalChildren: [ 'title-button', 'title-button-grid' ],

    _init: function (props={}) {
        this.parent(props);

        let after = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        after.get_style_context().add_class('after');
        this._title_button_grid.attach(after, 1, 0, 1, 1);

        let separator = new Gtk.Separator({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });
        this.add(separator);

        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
                context: arrangement.get_models(),
            });
        });
        this.add(this._arrangement);

        if (!this.show_title) {
            this._title_button.no_show_all = true;
            this._title_button.hide();
            separator.hide();
        }

        this._title_button.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ALL_SETS_CLICKED,
            });
        });

        Utils.set_hand_cursor_on_widget(this._title_button);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.APPEND_SETS:
                    // Use the sets generated on app startup to populate the
                    // suggested categories module.
                    payload.models.forEach(this._arrangement.add_model,
                        this._arrangement);
                    break;
                case Actions.CLEAR_SETS:
                    this._arrangement.clear();
                    break;
                case Actions.HIGHLIGHT_ITEM:
                    this._arrangement.highlight(payload.model);
                    break;
                case Actions.CLEAR_HIGHLIGHTED_ITEM:
                    this._arrangement.clear_highlight();
                    break;
            }
        });
    },
});
