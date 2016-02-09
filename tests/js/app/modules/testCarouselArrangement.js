const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CarouselArrangement = imports.app.modules.carouselArrangement;
const Compliance = imports.tests.compliance;

Gtk.init(null);

Compliance.test_arrangement_compliance(CarouselArrangement.CarouselArrangement);
