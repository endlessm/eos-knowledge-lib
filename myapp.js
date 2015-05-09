const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

imports.searchPath.unshift('.');
const Factory = imports.factory;

Gtk.init(null);
Gio.Resource.load('test.gresource')._register();

let factory = new Factory.Factory({
    app_description: Gio.File.new_for_uri('resource:///com/endlessm/test/app.json'),
});

let my_app = factory.create_app();
my_app.run(ARGV);
