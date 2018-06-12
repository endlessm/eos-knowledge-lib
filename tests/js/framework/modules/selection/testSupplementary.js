const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const Supplementary = imports.framework.modules.selection.supplementary;

Gtk.init(null);

Compliance.test_selection_compliance(Supplementary.Supplementary);
Compliance.test_xapian_selection_compliance(Supplementary.Supplementary);
