const EosKnowledge = imports.gi.EosKnowledge;

const CssClassMatcher = imports.CssClassMatcher;

describe('Base home page class', function () {
    let home_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new EosKnowledge.HomePage();
    });

    it('can be constructed', function () {});

    describe('CSS style context', function () {
        it('has home page class', function () {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE);
        });
        it('has a descendant with title image class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_TITLE_IMAGE);
        });
        it('has a descendant with search box class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SEARCH_BOX);
        });
    });
});
