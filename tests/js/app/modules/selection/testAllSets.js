const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const AllSets = imports.app.modules.selection.allSets;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(AllSets.AllSets);
