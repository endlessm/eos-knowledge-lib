const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const GridArrangement = imports.app.modules.gridArrangement;
const Minimal = imports.tests.minimal;

Gtk.init(null);

Minimal.test_arrangement_compliance(GridArrangement.GridArrangement);
