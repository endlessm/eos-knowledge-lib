const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;

Gtk.init(null);

describe('Arrangement interface', function () {
    let arrangement;

    beforeEach(function () {
        arrangement = new Minimal.MinimalArrangement();
    });

    it('has a minimal implementation', function () {
        expect(arrangement).toBeDefined();
    });
});
