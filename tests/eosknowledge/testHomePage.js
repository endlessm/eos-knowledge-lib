const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe('Base home page class', function () {
    let home_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new EosKnowledge.HomePage({
            title: "Guatemala",
            subtitle: "A place where Fernando is king"
        });
    });

    it('can be constructed', function () {});

    it('can set title and subtitle', function () {
        home_page.title = "Brazil";
        expect(home_page.title).toBe("Brazil");

        home_page.subtitle = "The land of caipirinhas";
        expect(home_page.subtitle).toBe("The land of caipirinhas");
    });

    describe('CSS style context', function () {
        it('has home page class', function () {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_TITLE);
        });
        it('has a descendant with subtitle class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_SUBTITLE);
        });
        it('has a descendant with search box class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SEARCH_BOX);
        });
    });
});
