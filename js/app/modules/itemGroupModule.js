// Copyright 2015 Endless Mobile, Inc.

/* exported ItemGroupModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
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
const ItemGroupModule = new Module.Class({
    Name: 'ItemGroupModule',
    GTypeName: 'EknItemGroupModule',
    CssName: 'EknItemGroupModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        let arrangement = this.create_submodule('arrangement');
        arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
            });
        });
        this.add(arrangement);

        let dispatcher = Dispatcher.get_default();
        if (arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            arrangement.connect('need-more-content', () => dispatcher.dispatch({
                action_type: Actions.NEED_MORE_ITEMS,
            }));
        }
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_ITEMS:
                    arrangement.clear();
                    break;
                case Actions.APPEND_ITEMS:
                    arrangement.fade_cards = (arrangement.get_count() > 0);
                    payload.models.forEach(arrangement.add_model, arrangement);
                    if (arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
                        arrangement.new_content_added();
                    }
                    break;
                case Actions.HIGHLIGHT_ITEM:
                    arrangement.highlight(payload.model);
                    break;
                case Actions.CLEAR_HIGHLIGHTED_ITEM:
                    arrangement.clear_highlight();
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement'];
    },
});
