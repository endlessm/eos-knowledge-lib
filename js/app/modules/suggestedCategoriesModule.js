// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedCategoriesModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const ThemeableImage = imports.app.widgets.themeableImage;

const Utils = imports.app.utils;

/**
 * Class: SuggestedCategoriesModule
 * A module that displays all suggested articles as cards in an arrangement.
 *
 * CSS classes:
 *   suggested-categories - on the module itself
 *   browse-content - on the "Browse Categories" title
 *
 * Slots:
 *   arrangement
 */
const SuggestedCategoriesModule = new Lang.Class({
    Name: 'SuggestedCategoriesModule',
    GTypeName: 'EknSuggestedCategoriesModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
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

    Template: 'resource:///com/endlessm/knowledge/data/widgets/suggestedCategoriesModule.ui',
    InternalChildren: [ 'title-button', 'title-button-grid' ],

    _init: function (props={}) {
        this.parent(props);

        let after = new ThemeableImage.ThemeableImage({
            visible: true,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        after.get_style_context().add_class(StyleClasses.AFTER);
        this._title_button_grid.attach(after, 1, 0, 1, 1);

        let separator = new ThemeableImage.ThemeableImage({
            visible: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.CENTER,
            no_show_all: true,
        });
        separator.get_style_context().add_class(Gtk.STYLE_CLASS_SEPARATOR);
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
                case Actions.FILTER_SETS:
                    this._filter_sets(payload.sets);
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

    // Module override
    get_slot_names: function () {
        return ['arrangement'];
    },

    _filter_sets: function (sets) {
        this._arrangement.get_models().forEach(model => {
            if (sets.indexOf(model.ekn_id) !== -1) {
                this._arrangement.remove_model(model);
            }
        });
    },
});
