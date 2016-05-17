const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Carousel = imports.app.modules.arrangement.carousel;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_arrangement_compliance(Carousel.Carousel);
