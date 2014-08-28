const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Text card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new EosKnowledge.TextCard();
    });

    it('has text card class', function () {
        expect(card).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TEXT_CARD);
    });
});
