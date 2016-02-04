// Copyright 2015 Endless Mobile, Inc.

/* exported SetGroupModule */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const CardContainer = imports.app.interfaces.cardContainer;
const Dispatcher = imports.app.dispatcher;
const Expandable = imports.app.interfaces.expandable;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SetGroupModule
 * A module that displays all application sets as cards in an arrangement.
 *
 * CSS Styles:
 *      set-group - on the module
 *
 * Slots:
 *   arrangement
 */
const SetGroupModule = new Lang.Class({
    Name: 'SetGroupModule',
    GTypeName: 'EknSetGroupModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module, Expandable.Expandable,
        CardContainer.CardContainer ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'has-more-content': GObject.ParamSpec.override('has-more-content', Expandable.Expandable),
        'fade-cards': GObject.ParamSpec.override('fade-cards',
            CardContainer.CardContainer),
        /**
         * Property: max-children
         *
         * The maximum amount of child widgets to show
         */
        'max-children':  GObject.ParamSpec.int('max-children', 'Max children',
            'The number of children to show in this container',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXINT32, 1000),
    },

    _init: function (props={}) {
        this.parent(props);
        this.has_more_content = false;
        this._arrangement = this.create_submodule('arrangement');
        this.add(this._arrangement);
        this.get_style_context().add_class(StyleClasses.SET_GROUP);

        let dispatcher = Dispatcher.get_default();
        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.connect('need-more-content', () => dispatcher.dispatch({
                action_type: Actions.NEED_MORE_SETS,
            }));
        }
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SETS:
                    this._arrangement.clear();
                    this._cards = [];
                    break;
                case Actions.APPEND_SETS:
                    let fade = this.fade_cards &&
                        (this._arrangement.get_models().length > 0);
                    payload.models.forEach(this._add_card.bind(this, fade));

                    if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
                        this._arrangement.new_content_added();
                    }
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

    _add_card: function (fade, model) {
        if (this._arrangement.get_models().length === this.max_children)
            return;

        let card = this._arrangement.add_model(model);
        if (fade)
            card.fade_in();
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
                context: this._arrangement.get_models(),
            });
        });
        this._check_more_content();
    },

    _check_more_content: function () {
        this.has_more_content = this._arrangement.get_models().length > this.max_children ||
            !this._arrangement.all_visible;
        this.notify('has-more-content');
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this._check_more_content();
    },
});
