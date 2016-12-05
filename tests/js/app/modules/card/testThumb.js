const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const Thumb = imports.app.modules.card.thumb;

Gtk.init(null);

describe('Card.Thumb', function () {
    it('has labels that understand Pango markup', function () {
        let card = new Thumb.Thumb({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
                synopsis: '@@@',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Thumb.Thumb);
