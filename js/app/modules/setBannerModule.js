// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: SetBannerModule
 *
 * A module which listens for the set-select action to be dispatched, and
 * creates a card for the selected model.
 *
 * Slots:
 *   card_type
 */
const SetBannerModule = new Lang.Class({
    Name: 'SetBannerModule',
    GTypeName: 'EknSetBannerModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SET_SELECTED:
                    let card = this.create_submodule('card_type', {
                        model: payload.model,
                    });
                    if (this.get_child())
                        this.remove(this.get_child());
                    this.add(card);
                    break;
            }
        });
    },

    get_slot_names: function () {
        return [ 'card_type' ];
    },
});
