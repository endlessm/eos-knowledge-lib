const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SpaceContainer = imports.app.spaceContainer;

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
let container = new SpaceContainer.SpaceContainer({
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
let spacing = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 1000,
        step_increment: 1,
    }),
});
spacing.bind_property('value', container, 'spacing',
    GObject.BindingFlags.DEFAULT);
let grid = new Gtk.Grid({
    orientation: Gtk.Orientation.VERTICAL,
});
grid.attach(add_new, 0, 0, 1, 1);
grid.attach(clear, 1, 0, 1, 1);
grid.attach(spacing, 2, 0, 1, 1);
grid.attach(container, 0, 1, 3, 1);
win.add(grid);
win.show_all();
win.connect('destroy', Gtk.main_quit);
Gtk.main();
