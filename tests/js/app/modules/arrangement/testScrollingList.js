const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ScrollingList = imports.app.modules.arrangement.scrollingList;

Gtk.init(null);

Compliance.test_arrangement_compliance(ScrollingList.ScrollingList);
Compliance.test_arrangement_fade_in_compliance(ScrollingList.ScrollingList);
