const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: HomePageBTemplate
 *
 * A Home Page Template used for Template B apps.
 *
 * CSS Styles:
 *      home-page-b-template - on the template
 *
 */
const HomePageBTemplate = new Lang.Class({
    Name: 'HomePageBTemplate',
    GTypeName: 'EknHomePageBTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/homePageBTemplate.ui',

    _init: function (props={}) {
        this._cards = null;
        this.parent(props);

        const PACKING_ARGS = {
            'top_left': [0, 0, 1, 1],
            'top_right': [1, 0, 1, 1],
            'bottom': [0, 1, 2, 2],
        };
        this.get_slot_names().forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this.attach.bind(this, submodule).apply(this, PACKING_ARGS[slot]);
            this['_' + slot] = submodule;
        });
    },

    get_slot_names: function () {
        return [ 'top_left', 'top_right', 'bottom' ];
    },
});
