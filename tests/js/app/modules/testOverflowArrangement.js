const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const OverflowArrangement = imports.app.modules.overflowArrangement;

Gtk.init(null);

Compliance.test_arrangement_compliance(OverflowArrangement.OverflowArrangement);
