const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Lesson card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new EosKnowledge.LessonCard();
    });

    describe('CSS style class', function () {
        it('has complete class when completed', function () {
            card.complete = true;
            expect(card).toHaveCssClass(EosKnowledge.STYLE_CLASS_COMPLETE);
        });

        it('does not have complete class when not completed', function () {
            card.complete = false;
            expect(card).not.toHaveCssClass(EosKnowledge.STYLE_CLASS_COMPLETE);
        });
    });
});
