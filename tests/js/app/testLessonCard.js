const CssClassMatcher = imports.tests.CssClassMatcher;
const LessonCard = imports.app.lessonCard;
const StyleClasses = imports.app.styleClasses;

describe('Lesson card widget', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new LessonCard.LessonCard();
    });

    describe('CSS style class', function () {
        it('has complete class when completed', function () {
            card.complete = true;
            expect(card).toHaveCssClass(StyleClasses.COMPLETE);
        });

        it('does not have complete class when not completed', function () {
            card.complete = false;
            expect(card).not.toHaveCssClass(StyleClasses.COMPLETE);
        });
    });
});
