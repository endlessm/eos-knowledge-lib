const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CarouselArrangement = imports.app.modules.carouselArrangement;
const Minimal = imports.tests.minimal;

Gtk.init(null);

Minimal.test_arrangement_compliance(CarouselArrangement.CarouselArrangement);
