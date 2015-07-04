const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const SetBanner = imports.app.setBanner;

Gtk.init(null);

describe('Set banner widget', function () {
    let setBanner;

    beforeEach(function () {
        setBanner = new SetBanner.SetBanner();
    });

    it('constructs', function () {});
});
