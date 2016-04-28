// Copyright (C) 2014-2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const NavButtonOverlay = imports.app.widgets.navButtonOverlay;
const Utils = imports.tests.utils;

let win = new Gtk.Window({
    default_width : 300,
    default_height: 100,
});
win.connect('destroy', Gtk.main_quit);

let stack = new Gtk.Stack({});
let labels = [];
for (let i = 0; i < 3; i++) {
    labels.push(new Gtk.Label({ label : "page: " + i }));
    stack.add(labels[i]);
}

let buttons = new NavButtonOverlay.NavButtonOverlay({});
buttons.add(stack);
win.add(buttons);

buttons.connect('back-clicked', function() {
    let index = labels.indexOf(stack.visible_child);
    index--;
    index = index < 0 ? 2 : index;
    stack.set_visible_child(labels[index]);
});

buttons.connect('forward-clicked', function() {
    let index = labels.indexOf(stack.visible_child);
    index = (index + 1) % 3;
    stack.set_visible_child(labels[index]);
});

Utils.register_gresource();
let provider = new Gtk.CssProvider();
let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
provider.load_from_file(css_file);
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
    provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

win.show_all();
Gtk.main();
