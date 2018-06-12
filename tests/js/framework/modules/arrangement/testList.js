const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const List = imports.framework.modules.arrangement.list;

Gtk.init(null);

Compliance.test_arrangement_compliance(List.List);
Compliance.test_arrangement_fade_in_compliance(List.List);
