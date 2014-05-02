const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const CssClassMatcher = imports.CssClassMatcher;

let app = new Endless.Application({
    application_id: 'com.endlessm.knowledge.test.dummy',
    flags: 0
});
app.run([]);

describe('Window A', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        view = new EosKnowledge.WindowA({
            application: app
        });
    });

    afterEach(function () {
        view.destroy();
    });

    it('can be constructed', function () {
        expect(view).toBeDefined();
    });

    it('instantiates a home page A', function () {
        expect(view.home_page).toBeA(EosKnowledge.HomePageA);
    });

    it('instantiates a section page A', function () {
        expect(view.section_page).toBeA(EosKnowledge.SectionPageA);
    });

    it('instantiates a article page A', function () {
        expect(view.article_page).toBeA(EosKnowledge.ArticlePageA);
    });

    it('visible page updates with show_*_page functions', function () {
        view.show_article_page();
        expect(view.get_visible_page()).toBe(view.article_page);
        view.show_section_page();
        expect(view.get_visible_page()).toBe(view.section_page);
        view.show_home_page();
        expect(view.get_visible_page()).toBe(view.home_page);
    });

    it('starts on home page', function () {
        expect(view.get_visible_page()).toBe(view.home_page);
    });

    it('has a back and forward button on the section and article page', function () {
        view.show_section_page();
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_BACK_BUTTON);
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_FORWARD_BUTTON);
        view.show_article_page();
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_BACK_BUTTON);
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_FORWARD_BUTTON);
    });

    it('does not have a back and forward button on the home page', function () {
        view.show_home_page();
        expect(view).not.toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_BACK_BUTTON);
        expect(view).not.toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOPBAR_FORWARD_BUTTON);
    });
});
