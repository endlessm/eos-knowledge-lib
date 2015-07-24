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

    it('has labels that understand Pango markup', function () {
        let card = new SetBannerCard.SetBannerCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
