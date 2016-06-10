const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const AllHighlights = imports.app.modules.selection.allHighlights;

Gtk.init(null);

Compliance.test_selection_compliance(AllHighlights.AllHighlights);
