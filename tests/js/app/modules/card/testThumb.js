const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const Thumb = imports.app.modules.card.thumb;

Gtk.init(null);

describe('Card.Thumb', function () {
    it('has labels that understand Pango markup', function () {
        let card = new Thumb.Thumb({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});
