const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const SuggestedArticles = imports.app.modules.selection.suggestedArticles;

Gtk.init(null);

Compliance.test_selection_compliance(SuggestedArticles.SuggestedArticles);
