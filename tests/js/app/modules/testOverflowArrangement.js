const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;
const OverflowArrangement = imports.app.modules.overflowArrangement;

Gtk.init(null);

describe('Overflow arrangement', function () {
    beforeEach(function () {
        this.arrangement = new OverflowArrangement.OverflowArrangement();
    });

    it('constructs', function () {
        expect(this.arrangement).toBeDefined();
    });

    Minimal.test_arrangement_compliance();
});
