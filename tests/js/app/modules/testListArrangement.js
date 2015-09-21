const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ListArrangement = imports.app.modules.listArrangement;
const Minimal = imports.tests.minimal;

Gtk.init(null);

describe('List arrangement', function () {
    beforeEach(function () {
        // Use the test suite's provided "this" object so that arrangement can
        // be in scope in the compliance tests in minimal.js.
        this.arrangement = new ListArrangement.ListArrangement();
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();
});
