const Gtk = imports.gi.Gtk;

const Card = imports.app.card;
const CssClassMatcher = imports.tests.CssClassMatcher;
const SectionPageA = imports.app.sectionPageA;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('Section page for Template A', function () {
    let section_page, segments;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        section_page = new SectionPageA.SectionPageA({
            title: "History of Guatemala"
        });

        segments = {
            'Lessons': [
                new Card.Card({
                    title: 'Subtitled Card',
                    synopsis: 'This is the Subtitle',
                }),
                new Card.Card({
                    title: 'Picture Card',
                    thumbnail_uri: TEST_CONTENT_DIR + 'pig1.jpg',
                }),
            ],
            'Articles': [
                new Card.Card({
                    title: 'Everything card',
                    synopsis: 'This card has everything',
                    thumbnail_uri: TEST_CONTENT_DIR + 'pig2.jpg',
                }),
            ],
        };
    });

    it('can be constructed', function () {});

    it('can set cards', function () {
        for (let segment_title in segments) {
            section_page.append_to_segment(segment_title, segments[segment_title]);
            for (let card of segments[segment_title]) {
                expect(section_page).toHaveDescendant(card);
            }
        }
    });

    it('can set title', function () {
        section_page.title = "Brazil";
        expect(section_page.title).toBe("Brazil");
    });

    describe('Style class of section page', function () {
        it('has section-page-a class', function () {
            expect(section_page).toHaveCssClass(StyleClasses.SECTION_PAGE_A);
        });

        it('has a descendant with title class', function () {
            expect(section_page).toHaveDescendantWithCssClass(StyleClasses.SECTION_PAGE_TITLE);
        });

        it('has a descendant with segment_title class', function () {
            for (let segment_title in segments) {
                section_page.append_to_segment(segment_title, segments[segment_title]);
            }
            expect(section_page).toHaveDescendantWithCssClass(StyleClasses.SECTION_PAGE_A_SEGMENT_TITLE);
        });

    });
});
