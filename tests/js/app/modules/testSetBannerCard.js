const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const SetBannerCard = imports.app.modules.setBannerCard;

Gtk.init(null);

describe('Set banner widget', function () {
    let setBannerCard;

    beforeEach(function () {
        setBannerCard = new SetBannerCard.SetBannerCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('constructs', function () {});
});
