const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const AllHighlights = imports.app.modules.selection.allHighlights;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(AllHighlights.AllHighlights);
