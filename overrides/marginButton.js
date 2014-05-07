const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

// A button that actually supports the margin css property! Makes styling our
// apps a lot easier.
const MarginButton = new Lang.Class({
    Name: 'MarginButton',
    GTypeName: 'EknMarginButton',
    Extends: Gtk.Button,

    _get_margin: function () {
        return this.get_style_context().get_margin(this.get_state_flags());
    },

    _grow_request_by_margin_width: function (request) {
        let margin = this._get_margin();
        let extra_width = margin.left + margin.right;
        return [request[0] + extra_width, request[1] + extra_width];
    },

    _grow_request_by_margin_height: function (request) {
        let margin = this._get_margin();
        let extra_height = margin.top + margin.bottom;
        return [request[0] + extra_height, request[1] + extra_height];
    },

    vfunc_get_preferred_width: function () {
        return this._grow_request_by_margin_width(this.parent());
    },

    vfunc_get_preferred_height: function () {
        return this._grow_request_by_margin_height(this.parent());
    },

    vfunc_get_preferred_width_for_height: function (height) {
        return this._grow_request_by_margin_width(this.parent(height));
    },

    vfunc_get_preferred_height_for_width: function (width) {
        return this._grow_request_by_margin_height(this.parent(width));
    },

    vfunc_get_preferred_height_and_baseline_for_width: function (width) {
        let margin = this._get_margin();
        let [height_min, height_nat, baseline_min, baseline_nat] = this.parent(width);
        return [height_min + margin.top + margin.bottom,
                height_nat + margin.top + margin.bottom,
                baseline_min + margin.top,
                baseline_nat + margin.top];
    },

    vfunc_size_allocate: function (alloc) {
        let margin = this._get_margin();
        alloc.x += margin.left;
        alloc.y += margin.top;
        alloc.width -= margin.left + margin.right;
        alloc.height -= margin.top + margin.bottom;
        this.parent(alloc);
    }
});
