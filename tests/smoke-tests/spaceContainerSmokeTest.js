const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

Gtk.init(null);

// Colored box with a natural request of a particular size. It can be compressed
// by up to half of its natural request in the height direction.
const CompressibleBox = new Lang.Class({
    Name: 'CompressibleBox',
    Extends: Gtk.Frame,

    _init: function (props={}) {
        this.parent(props);

        this._width = GLib.random_int_range(50, 200);
        this._height = GLib.random_int_range(50, 200);

        let label = new Gtk.Label({
            label: this._width + 'x' + this._height,
        });
        this.add(label);

        let context = this.get_style_context();
        let colors = ['fce94f', 'fcaf3e', 'e9b96e', '8ae234', '729fcf',
            'ad7fa8', 'ef2929', '888a85'];
        let color = colors[GLib.random_int_range(0, colors.length)];
        let provider = new Gtk.CssProvider();
        provider.load_from_data('*{background-color:#' + color + ';}');
        context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    vfunc_get_preferred_width: function () {
        return [this._width / 2, this._width];
    },

    vfunc_get_preferred_height: function () {
        return [this._height / 2, this._height];
    },
});

let win = new Gtk.Window({
    default_width: 600,
    default_height: 300,
});
let container = new EosKnowledge.SpaceContainer({
    orientation: Gtk.Orientation.HORIZONTAL,
});
let add_new = new Gtk.Button({
    label: 'Add new box',
});
add_new.connect('clicked', function () {
    let box = new CompressibleBox({
        expand: false,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.START,
    });
    box.show_all();
    container.add(box);
});
let clear = new Gtk.Button({
    label: 'Clear',
});
clear.connect('clicked', function () {
    container.get_children().forEach(container.remove, container);
});
let grid = new Gtk.Grid({
    orientation: Gtk.Orientation.VERTICAL,
});
grid.add(add_new);
grid.add(clear);
grid.add(container);
win.add(grid);
win.show_all();
win.connect('destroy', Gtk.main_quit);
Gtk.main();
