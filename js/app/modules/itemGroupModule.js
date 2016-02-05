// Copyright 2015 Endless Mobile, Inc.

/* exported ItemGroupModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const CardContainer = imports.app.interfaces.cardContainer;
const Dispatcher = imports.app.dispatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

/**
 * Class: ItemGroupModule
 * A module that displays all items in a set as cards in an arrangement
 *
 * This container displays cards delivered in batches using
 * <Actions.APPEND_ITEMS>.
 * Any cards lazily loaded after the first batch are faded in.
 *
 * Slots:
 *   arrangement
 */
const ItemGroupModule = new Lang.Class({
    Name: 'ItemGroupModule',
    GTypeName: 'EknItemGroupModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module, CardContainer.CardContainer ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this.add(this._arrangement);

        let dispatcher = Dispatcher.get_default();
        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.connect('need-more-content', () => dispatcher.dispatch({
                action_type: Actions.NEED_MORE_ITEMS,
            }));
        }
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_ITEMS:
                    this._arrangement.clear();
                    this._cards = [];
                    break;
                case Actions.APPEND_ITEMS:
                    this._arrangement.fade_cards =
                        (this._arrangement.get_models().length > 0);
                    payload.models.forEach(this._add_card, this);
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

    _add_card: function (model) {
        let card = this._arrangement.add_model(model);
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._arrangement.get_models(),
            });
        });
    },
});
