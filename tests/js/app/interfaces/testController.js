const Gtk = imports.gi.Gtk;

const Minimal = imports.tests.minimal;

Gtk.init(null);

describe('Controller interface', function () {
    let controller;

    beforeEach(function () {
        controller = new Minimal.MinimalController();
    });

    it('can be constructed', function () {
        expect(controller).toBeDefined();
    });
});
