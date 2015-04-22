const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Section page for Template B', function () {
    let section_page;
    let card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        section_page = new EosKnowledge.SectionPageB({
            title: "History of Guatemala"
        });

        card_list = [
            new EosKnowledge.TextCard({title: 'Text card 1'}),
            new EosKnowledge.TextCard({title: 'Text card 2'}),
            new EosKnowledge.TextCard({title: 'Text card 3'})
        ];
    });

    it('can be constructed', function () {});

    it('can set title', function () {
        section_page.title = "Brazil";
        expect(section_page.title).toBe("Brazil");
    });

    it('can set cards', function () {
        section_page.cards = card_list;
        expect(section_page.cards).toBe(card_list);
    });

    describe('Style class of section page', function () {
        it('has section-page-b class', function () {
            expect(section_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_SECTION_PAGE_B);
        });

        it('has a descendant with title class', function () {
            expect(section_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SECTION_PAGE_TITLE);
        });
    });
});
