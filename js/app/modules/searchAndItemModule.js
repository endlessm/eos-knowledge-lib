// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: SearchAndItemModule
 * A module that will flip between a <SearchModule> and <ItemGroupModule>.
 *
 * Slots:
 *   search
 *   item
 */
const SearchAndItemModule = new Lang.Class({
    Name: 'SearchAndItemModule',
    GTypeName: 'EknSearchAndItemModule',
    CssName: 'EknSearchAndItemModule',
    Extends: Gtk.Stack,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.visible = true;
        this.parent(props);
        this._search = this.create_submodule('search');
        this._item = this.create_submodule('item');
        this.add(this._search);
        this.add(this._item);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_READY:
                    this.set_visible_child(this._search);
                    break;
                case Actions.SET_READY:
                    this.set_visible_child(this._item);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['search', 'item'];
    },
});
