const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CardA = imports.app.cardA;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card widget', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
    });

    it('has the correct style class', function () {
        let card = new CardA.CardA();
        expect(card).toHaveCssClass(StyleClasses.CARD_A);
    });

    it('has a fixed size', function () {
        let card1 = new CardA.CardA({
            model: new ContentObjectModel.ContentObjectModel({
                title: 'short',
            }),
        });
        let card2 = new CardA.CardA({
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
});
