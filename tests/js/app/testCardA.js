const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gtk = imports.gi.Gtk;

const CardA = imports.app.cardA;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new CardA.CardA();
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(EosKnowledgePrivate.STYLE_CLASS_CARD_A);
        });
    });
});
