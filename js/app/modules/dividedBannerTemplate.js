const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

/**
 * Class: DividedBannerTemplate
 *
 * A Home Page Template used for Template B apps.
 *
 * CSS Styles:
 *      home-page-b-template - on the template
 *
 * Slots:
 *   top-left
 *   top-right
 *   bottom
 */
const DividedBannerTemplate = new Module.Class({
    Name: 'DividedBannerTemplate',
    GTypeName: 'EknDividedBannerTemplate',
    CssName: 'EknDividedBannerTemplate',
    Extends: Gtk.Grid,

    Slots: {
        'top-left': {},
        'top-right': {},
        'bottom': {},
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
        DividedBannerTemplate.get_slot_names().forEach(slot => {
            let submodule = this.create_submodule(slot);
            this.attach.bind(this, submodule).apply(this, PACKING_ARGS[slot]);
            this['_' + slot] = submodule;
        });

        this._orig_row_spacing = null;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        if (this._orig_row_spacing === null) {
            this._orig_row_spacing = this.row_spacing;
        }

        if (alloc.width < this.WIDTH_THRESHOLD) {
            this.row_spacing = this._orig_row_spacing / 2;
        } else {
            this.row_spacing = this._orig_row_spacing;
        }
    },
});
