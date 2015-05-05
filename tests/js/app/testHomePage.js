const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePage = imports.app.homePage;

describe('Base home page class', function () {
    let home_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new HomePage.HomePage();
    });

    it('can be constructed', function () {});

    describe('CSS style context', function () {
        it('has home page class', function () {
            expect(home_page).toHaveCssClass(EosKnowledgePrivate.STYLE_CLASS_HOME_PAGE);
        });
        it('has a descendant with title image class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledgePrivate.STYLE_CLASS_HOME_PAGE_TITLE_IMAGE);
        });
        it('has a descendant with search box class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledgePrivate.STYLE_CLASS_SEARCH_BOX);
        });
    });
});
