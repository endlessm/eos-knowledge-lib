const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const StaticArticles = imports.app.modules.selection.staticArticles;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(StaticArticles.StaticArticles);
Compliance.test_xapian_selection_compliance(StaticArticles.StaticArticles);
