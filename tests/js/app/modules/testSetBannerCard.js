const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const SetBannerCard = imports.app.modules.setBannerCard;

Gtk.init(null);

describe('Set banner widget', function () {
    let setBannerCard;

    beforeEach(function () {
        setBannerCard = new SetBannerCard.SetBannerCard();
    });

    it('constructs', function () {});
});
