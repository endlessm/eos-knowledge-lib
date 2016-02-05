const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ListArrangement = imports.app.modules.listArrangement;
const Minimal = imports.tests.minimal;

Gtk.init(null);

Minimal.test_arrangement_compliance(ListArrangement.ListArrangement);
Minimal.test_arrangement_fade_in_compliance(ListArrangement.ListArrangement);
