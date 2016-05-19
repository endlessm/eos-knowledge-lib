/* Copyright 2014 Endless Mobile, Inc. */

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ProgressLabel = imports.app.widgets.progressLabel;
const Utils = imports.tests.utils;

let win = new Gtk.Window();
let grid = new Gtk.Grid();
let label = new ProgressLabel.ProgressLabel({
    halign: Gtk.Align.CENTER,
    margin: 30,
});
let spinner1 = Gtk.SpinButton.new_with_range(1, 10, 1);
let spinner2 = Gtk.SpinButton.new_with_range(1, 10, 1);
spinner2.value = 10;

grid.attach(spinner1, 0, 0, 1, 1);
grid.attach(spinner2, 1, 0, 1, 1);
grid.attach(label, 0, 1, 2, 1);
win.add(grid);

let flags = GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE;
spinner1.bind_property('value', label, 'current-page', flags);
spinner2.bind_property('value', label, 'total-pages', flags);
label.connect('notify', function () {
    if (label.current_page === label.total_pages)
        grid.get_style_context().add_class('back-cover');
    else
        grid.get_style_context().remove_class('back-cover');
});
win.connect('destroy', Gtk.main_quit);

Utils.register_gresource();
let provider = new Gtk.CssProvider();
let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/aisle.css');
provider.load_from_file(css_file);
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
    provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

win.show_all();
Gtk.main();
