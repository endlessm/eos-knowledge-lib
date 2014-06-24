const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

EosKnowledge.init();

describe('Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new EosKnowledge.CardA();
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(EosKnowledge.STYLE_CLASS_CARD_A);
        });
    });
});
