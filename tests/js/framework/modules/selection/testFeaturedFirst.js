const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const FeaturedFirst = imports.framework.modules.selection.featuredFirst;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_selection_compliance(FeaturedFirst.FeaturedFirst);
Compliance.test_xapian_selection_compliance(FeaturedFirst.FeaturedFirst);
