// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: EncyclopediaContentTemplate
 *
 * A Template used for the search results page of encyclopedia apps.
 *
 * CSS Styles:
 *      encyclopedia-content-template - on the template
 *
 * Slots:
 *   - top_left
 *   - top_right
 *   - bottom
 */
const EncyclopediaContentTemplate = new Lang.Class({
    Name: 'EncyclopediaContentTemplate',
    GTypeName: 'EknEncyclopediaContentTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/encyclopediaContentTemplate.ui',

    _init: function (props={}) {
        this.parent(props);

        ['top_left', 'top_right', 'bottom'].forEach(this._pack_slot.bind(this));
    },

    _pack_slot: function (slot, props={}) {
        let submodule = this.create_submodule(slot, props);
        if (submodule) {
            switch (slot) {
                case 'top_left':
                    this.attach(submodule, 0, 0, 1, 1);
                    break;
                case 'top_right':
                    this.attach(submodule, 1, 0, 1, 1);
                    break;
                case 'bottom':
                    this.attach(submodule, 0, 1, 2, 1);
                    break;
            }
            this['_' + slot] = submodule;
        }
    },
});
