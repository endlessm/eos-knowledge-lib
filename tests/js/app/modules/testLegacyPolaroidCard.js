const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const LegacyPolaroidCard = imports.app.modules.legacyPolaroidCard;
const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Legacy Polaroid Card', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new LegacyPolaroidCard.LegacyPolaroidCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
        expect(card).toHaveCssClass(StyleClasses.LEGACY_POLAROID_CARD);
    });

    it('has a fixed size', function () {
        let card1 = new LegacyPolaroidCard.LegacyPolaroidCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: 'short',
            }),
        });
        let card2 = new LegacyPolaroidCard.LegacyPolaroidCard({
            model: new ContentObjectModel.ContentObjectModel({
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
        let card = new LegacyPolaroidCard.LegacyPolaroidCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_highlight_string_compliance(LegacyPolaroidCard.LegacyPolaroidCard);
