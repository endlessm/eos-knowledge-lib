const Gtk = imports.gi.Gtk;

const CardB = imports.app.cardB;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new CardB.CardB();
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(StyleClasses.CARD_B);
        });
    });
});
