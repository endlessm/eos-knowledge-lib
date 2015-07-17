const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const SectionPageB = imports.app.sectionPageB;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

const ArrangementWithWidth = new Lang.Class({
    Name: 'ArrangementWithWidth',
    Extends: Minimal.MinimalArrangement,
    Properties: {
        'preferred-width': GObject.ParamSpec.int('preferred-width', '', '',
            GObject.ParamFlags.READWRITE, -1, 9999, -1),
    },
});

describe('Section page for Template B', function () {
    let section_page, card_list, arrangement;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-arrangement',
            ArrangementWithWidth);

        section_page = new SectionPageB.SectionPageB({
            factory: factory,
        });
        arrangement = factory.get_created_named_mocks('results-arrangement')[0];

        card_list = [0, 1, 2].map(() => new Minimal.MinimalCard());
    });

    it('can be constructed', function () {});

    it('can set cards', function () {
        section_page.cards = card_list;
        expect(section_page.cards).toBe(card_list);
        expect(arrangement.count).toBe(3);
    });

    it('can append cards', function () {
        section_page.cards = card_list;
        expect(arrangement.count).toBe(3);
        section_page.append_cards([new Minimal.MinimalCard()]);
        expect(arrangement.count).toBe(4);
    });

    describe('Style class of section page', function () {
        it('has section-page-b class', function () {
            expect(section_page).toHaveCssClass(StyleClasses.SECTION_PAGE_B);
        });
    });
});
