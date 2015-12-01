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

    it('returns -1 for default card limit', function () {
        expect(arrangement.get_max_cards()).toBe(-1);
    });
});
