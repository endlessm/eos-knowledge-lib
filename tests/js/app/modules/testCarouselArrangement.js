const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CarouselArrangement = imports.app.modules.carouselArrangement;
const Minimal = imports.tests.minimal;

Gtk.init(null);

describe('Carousel arrangement', function () {
    beforeEach(function () {
        // Use the test suite's provided "this" object so that arrangement can
        // be in scope in the compliance tests in minimal.js.
        this.arrangement = new CarouselArrangement.CarouselArrangement();
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();
});
