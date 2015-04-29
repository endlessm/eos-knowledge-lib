const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CardB = imports.app.cardB;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new CardB.CardB();
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(EosKnowledge.STYLE_CLASS_CARD_B);
        });
    });
});
