const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const Accordion = imports.app.modules.arrangement.accordion;

Gtk.init(null);

Compliance.test_arrangement_compliance(Accordion.Accordion);
Compliance.test_arrangement_fade_in_compliance(Accordion.Accordion);
