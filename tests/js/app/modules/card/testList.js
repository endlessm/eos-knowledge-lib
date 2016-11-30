const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const List = imports.app.modules.card.list;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;

Gtk.init(null);

describe('Card.List', function () {
    beforeEach(function () {
        MockReadingHistoryModel.mock_default();
    });

    it('has labels that understand Pango markup', function () {
        let card = new List.List({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            }),
            navigation_context: '???',
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*???*').use_markup).toBeTruthy();
    });

    Compliance.test_card_compliance(List.List);
});

