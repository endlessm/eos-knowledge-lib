const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const LegacyPolaroid = imports.app.modules.card.legacyPolaroid;
const Compliance = imports.tests.compliance;

Gtk.init(null);

describe('Card.LegacyPolaroid', function () {
    it('has a fixed size', function () {
        let card1 = new LegacyPolaroid.LegacyPolaroid({
            model: Eknc.ContentObjectModel.new_from_props({
                title: 'short',
            }),
        });
        let card2 = new LegacyPolaroid.LegacyPolaroid({
            model: Eknc.ContentObjectModel.new_from_props({
                title: 'Really really really really really really really ' +
                    'really really really really really really really really ' +
                    'really long title',
            }),
        });
        let width = card1.get_preferred_width();
        expect(width).toEqual(card2.get_preferred_width());
        expect(card1.get_preferred_height()).toEqual(card2.get_preferred_height());
        expect(width[0]).toEqual(width[1]);
        expect(width[0]).toBeGreaterThan(1);
    });

    it('has labels that understand Pango markup', function () {
        let card = new LegacyPolaroid.LegacyPolaroid({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
                synopsis: '@@@',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(LegacyPolaroid.LegacyPolaroid);
