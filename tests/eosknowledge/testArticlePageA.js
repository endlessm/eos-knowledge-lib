const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Gtk = imports.gi.Gtk;

const InstanceOfMatcher = imports.InstanceOfMatcher;

Gtk.init(null);

const CssClassMatcher = imports.CssClassMatcher;

describe('Article Page A', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        page = new EosKnowledge.ArticlePageA();
    });

    it('can be constructed', function () {
        expect(page).toBeDefined();
    });

    it('instantiates a table of contents widget', function () {
        expect(page.toc).toBeA(EosKnowledge.TableOfContents);
    });

    it('instantiates a webview switcher widget', function () {
        expect(page.switcher).toBeA(EosKnowledge.WebviewSwitcherView);
    });

    describe('Style class of article page A', function () {
        it('has article page class', function () {
            expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        });
        it('has a descendant with toolbar frame class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME);
        });
        it('has a descendant with switcher frame class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME);
        });
        it('has a descendant with collapsed class when narrow', function () {
            let alloc = page.get_allocation();
            alloc.width = 1;
            alloc.height = 9999;
            page.size_allocate(alloc);
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
            alloc.width = 9999;
            alloc.height = 9999;
            page.size_allocate(alloc);
            expect(page).not.toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
        });
    });
});
