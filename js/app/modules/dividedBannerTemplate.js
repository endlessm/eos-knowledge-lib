const Cairo = imports.gi.cairo;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: DividedBannerTemplate
 *
 * A Home Page Template used for Template B apps.
 *
 * CSS Styles:
 *      home-page-b-template - on the template
 *
 */
const DividedBannerTemplate = new Lang.Class({
    Name: 'DividedBannerTemplate',
    GTypeName: 'EknDividedBannerTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/dividedBannerTemplate.ui',

    WIDTH_THRESHOLD: 800,

    _init: function (props={}) {
        this._cards = null;
        this.parent(props);

        const PACKING_ARGS = {
            'top-left': [0, 0, 1, 1],
            'top-right': [1, 0, 1, 1],
            'bottom': [0, 1, 2, 2],
        };
        this.get_slot_names().forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this.attach.bind(this, submodule).apply(this, PACKING_ARGS[slot]);
            this['_' + slot] = submodule;
        });

        this._orig_row_spacing = this.row_spacing;
    },

    get_slot_names: function () {
        return [ 'top-left', 'top-right', 'bottom' ];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        if (alloc.width < this.WIDTH_THRESHOLD) {
            this._orig_row_spacing = this.row_spacing;
            this.row_spacing = this._orig_row_spacing / 2;
        } else {
            this.row_spacing = this._orig_row_spacing;
        }
    },
});
