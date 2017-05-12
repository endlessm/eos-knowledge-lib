const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const All = imports.app.modules.selection.all;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(All.All);
Compliance.test_xapian_selection_compliance(All.All);
