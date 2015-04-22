const EosKnowledge = imports.gi.EosKnowledge;
const EvinceView = imports.gi.EvinceView;
const Gio = imports.gi.Gio;

const CssClassMatcher = imports.CssClassMatcher;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('PDF view', function () {
    let view;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        view = new EosKnowledge.PDFView();
    });

    it('constructs', function () {});

    it('opens pdfs in Evince', function () {
        let uri = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf').get_uri();
        view.load_uri(uri);
        expect(view).toHaveDescendantWithClass(EvinceView.View);
    });

    describe('CSS style context', function () {
        it('has a pdf view class', function () {
            expect(view).toHaveCssClass(EosKnowledge.STYLE_CLASS_PDF_VIEW);
        });
    });
});
