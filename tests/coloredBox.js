/* exported ColoredBox */

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: ColoredBox
 * Widget with a random color and label showing the allocation size. Useful for
 * smoke tests.
 */
var ColoredBox = new Lang.Class({
    Name: 'ColoredBox',
    Extends: Gtk.Frame,

    _init: function (props={}) {
        this.parent(props);

        this._label = new Gtk.Label();
        this.add(this._label);

        let context = this.get_style_context();
        let colors = ['fce94f', 'fcaf3e', 'e9b96e', '8ae234', '729fcf',
            'ad7fa8', 'ef2929', '888a85'];
        let color = colors[GLib.random_int_range(0, colors.length)];
        let provider = new Gtk.CssProvider();
        provider.load_from_data('*{background-color:#' + color + ';}');
        context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        this._label.label = alloc.width + 'x' + alloc.height;
    },
});

