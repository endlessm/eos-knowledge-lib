const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const OverflowArrangement = imports.app.modules.overflowArrangement;

Gtk.init(null);

Minimal.test_arrangement_compliance(OverflowArrangement.OverflowArrangement);
