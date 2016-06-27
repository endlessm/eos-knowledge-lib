const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const SupplementaryArticles = imports.app.modules.selection.supplementaryArticles;

Gtk.init(null);

Compliance.test_selection_compliance(SupplementaryArticles.SupplementaryArticles);
