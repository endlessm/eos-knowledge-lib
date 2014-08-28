const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Progress card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new EosKnowledge.ProgressCard({
            total_items: 5
        });
    });

    it('cannot have more completed items than total items', function () {
        card.completed_items = 10;
        expect(card.completed_items).not.toEqual(10);
    });

    describe('CSS style class', function () {
        it('has complete class when completed', function () {
            card.completed_items = 5;
            expect(card).toHaveCssClass(EosKnowledge.STYLE_CLASS_COMPLETE);
        });

        it('does not have complete class when not completed', function () {
            card.completed_items = 4;
            expect(card).not.toHaveCssClass(EosKnowledge.STYLE_CLASS_COMPLETE);
        });

        it('does not have complete class when there are no items', function () {
            card.completed_items = 5;
            card.total_items = 0;
            expect(card).not.toHaveCssClass(EosKnowledge.STYLE_CLASS_COMPLETE);
        });
    });
});
