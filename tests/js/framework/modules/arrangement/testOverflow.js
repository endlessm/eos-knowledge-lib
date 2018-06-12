const Gtk = imports.gi.Gtk;

const Compliance = imports.tests.compliance;
const Overflow = imports.framework.modules.arrangement.overflow;

Gtk.init(null);

Compliance.test_arrangement_compliance(Overflow.Overflow);
