const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticlesForSet = imports.app.modules.selection.articlesForSet;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(ArticlesForSet.ArticlesForSet);
