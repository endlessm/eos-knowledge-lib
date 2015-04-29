const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const TextCard = imports.app.textCard;

Gtk.init(null);

describe('Text card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new TextCard.TextCard();
    });

    it('has text card class', function () {
        expect(card).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TEXT_CARD);
    });
});
