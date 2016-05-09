const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const Grid = imports.app.modules.arrangement.grid;

Gtk.init(null);

Compliance.test_arrangement_compliance(Grid.Grid);
Compliance.test_arrangement_fade_in_compliance(Grid.Grid);
